import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Import the tag icon

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close'; // เพิ่มการ import CloseIcon
import { getIncidentReports } from '../api/client';
import type { IncidentReportDto } from '../api/client';
import {
  
    getSeverityColor,
    incidentStatusOptions,
    getIncidentStatusPaletteColor,
    severityOptions,
    getSeverityLabelEn,
    domainOptions,
    getDomainLabel,
    getSeverityLetter
} from '../constants/incidentOptions';


import Tooltip from '@mui/material/Tooltip';
import { useMediaQuery } from '@mui/material'; // Import useMediaQuery

// Add raw incident shape
type RawIncident = {
	// canonical fields (from API schema)
	id?: number | string;
	caseNo?: string | null;
	title?: string | null;
	description?: string | null;
	incidentDate?: string | null;
	severity?: number | string | null;
	asset?: string | null;
	center?: string | null;

	impact?: string | null;
	domain?: string | null;
	subDomain?: string | null;
	vendor?: string | null;
	manufacturer?: string | null;
	partNumber?: string | null;
	additionalInfo?: string | null;
	interimAction?: string | null;
	intermediateAction?: string | null;
	longTermAction?: string | null;
	status?: string | null;
	createdUserId?: number | null;
	updatedUserId?: number | null;
	createdUserName?: string | null;
	createdUserRole?: string | null;
	updatedUserName?: string | null;
	updatedUserRole?: string | null;
	responsibleName?: string | null;
	responsibleLineId?: string | null;
	responsibleEmail?: string | null;
	responsiblePhone?: string | null;
	createdUtc?: string | null;
	updatedUtc?: string | null;

	
	// allow any other unknown properties
	[key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function toRawIncidentArray(arr: unknown[]): RawIncident[] {
    return arr.filter(isRecord) as RawIncident[];
}

function HomePage() {
    
    const [issues, setIssues] = useState<IncidentReportDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(localStorage.getItem('filterSearch') || '');
    const [filterStatus, setFilterStatus] = useState(localStorage.getItem('filterStatus') || '');
    const [filterSeverity, setFilterSeverity] = useState(localStorage.getItem('filterSeverity') || '');
    const [filterDomain, setFilterDomain] = useState(localStorage.getItem('filterDomain') || ''); // Add state for domain filter
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if screen size is small
  
    const isFilterActive = !!search || !!filterStatus || !!filterSeverity; // ตรวจสอบว่ามีการใช้งาน Filter หรือไม่

    const handleClearFilter = () => {
        setSearch('');
        setFilterStatus('');
        setFilterSeverity('');
        setFilterDomain(''); // Clear domain filter
        localStorage.removeItem('filterSearch');
        localStorage.removeItem('filterStatus');
        localStorage.removeItem('filterSeverity');
        localStorage.removeItem('filterDomain'); // Remove domain filter from localStorage
    };

    // บันทึกค่าลงใน localStorage เมื่อ Filter เปลี่ยนแปลง
    useEffect(() => {
        localStorage.setItem('filterSearch', search);
    }, [search]);

    useEffect(() => {
        localStorage.setItem('filterStatus', filterStatus);
    }, [filterStatus]);

    useEffect(() => {
        localStorage.setItem('filterSeverity', filterSeverity);
    }, [filterSeverity]);

    // Save domain filter to localStorage
    useEffect(() => {
        localStorage.setItem('filterDomain', filterDomain);
    }, [filterDomain]);

    // --- new: date parse + formatter (return human-readable Gregorian with AD/era) ---
    const parseToDate = (value: unknown): Date | null => {
        if (!value && value !== 0) return null;
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        if (typeof value === 'number') {
            let n = value;
            // if looks like seconds, convert to ms
            if (n < 1e12) n = n * 1000;
            const d = new Date(n);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof value === 'string') {
            const s = value.trim();
            if (!s) return null;
            // MS JSON date: /Date(1234567890)/
            const msMatch = /\/Date\((-?\d+)\)\//.exec(s);
            if (msMatch) {
                const n = parseInt(msMatch[1], 10);
                const d = new Date(n);
                return isNaN(d.getTime()) ? null : d;
            }
            // numeric string timestamp
            if (/^-?\d+$/.test(s)) {
                let n = parseInt(s, 10);
                if (n < 1e12) n = n * 1000;
                const d = new Date(n);
                if (!isNaN(d.getTime())) return d;
            }
            // try ISO/parsible string
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    };

    // Always use en-US with era:'short' so era shows "AD" (ค.ศ. = AD)
    const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        era: 'short'
    });

    const formatDateTime = (value: unknown): string | undefined => {
        const d = parseToDate(value);
        if (!d) return undefined;
        return dateTimeFormatter.format(d);
    };
    // --- end new helper ---

    useEffect(() => {
        let mounted = true;
        console.log('[HomePage] effect mount');

        const normalizeResponse = (raw: unknown): RawIncident[] => {
            console.log('[HomePage] normalizeResponse raw =', raw);
            if (Array.isArray(raw)) return toRawIncidentArray(raw);
            if (isRecord(raw)) {
                if (Array.isArray(raw.data)) return toRawIncidentArray(raw.data);
                if (Array.isArray(raw.items)) return toRawIncidentArray(raw.items);
                if (Array.isArray(raw.value)) return toRawIncidentArray(raw.value);
                return [raw as RawIncident];
            }
            return [];
        };

        const normalizeIncident = (item: RawIncident, idx: number): IncidentReportDto => {
            const caseNo =
                item.case_no ??
                item.caseNo ??
                item.caseId ??
                item.caseNumber ??
                (typeof item.id === 'number' || typeof item.id === 'string' ? String(item.id) : undefined);

            const asset =
                item.asset ??
                item.device ??
                item.asset_name ??
                item.equipment;

            const center =
                item.center ??
                item.hospital ??
                item.center_name ??
                item.location;

            const incidentDate =
                item.incident_date ??
                item.date ??
                item.incidentDate ??
                item.reported_at;

            const symptoms =
                item.symptoms ??
                item.description ??
                item.symptom ??
                item.issue_description;

            // original raw status text (may be "Closed", "In Progress", "Open", etc.)
            const rawStatus =
                item.status ??
                item.state ??
                item.current_status ??
                (item.closed ? 'Closed' : 'In Progress');

            // try to map rawStatus (label or value) to a canonical option.value from incidentStatusOptions
            const mapStatusToValue = (s?: string | number | undefined) => {
                if (s === undefined || s === null) return undefined;
                const sStr = String(s).trim().toLowerCase();
                // find by value or label (loose compare, normalize whitespace and case)
                return incidentStatusOptions.find(opt => {
                    const val = String(opt.value ?? '').trim().toLowerCase();
                    const lbl = String(opt.label ?? '').trim().toLowerCase();
                    return val === sStr || lbl === sStr || val === sStr.replace(/\s+/g, '') || lbl === sStr.replace(/\s+/g, '');
                })?.value;
            };

            const status = mapStatusToValue(typeof rawStatus === 'string' || typeof rawStatus === 'number' ? rawStatus : undefined) ?? rawStatus;

            // normalize severity to canonical severityOptions[].value (string) when possible
            const rawSeverity =
                (item as Record<string, unknown>).severity ??
                (item as Record<string, unknown>).severity_level ??
                (item as Record<string, unknown>).severityLevel;

            const mapSeverityToValue = (s?: string | number | undefined) => {
                if (s === undefined || s === null) return undefined;
                const sStr = String(s).trim().toLowerCase();
                return severityOptions.find(opt => {
                    const val = String(opt.value ?? '').trim().toLowerCase();
                    const lbl = String(opt.label ?? '').trim().toLowerCase();
                    return val === sStr || lbl === sStr || val === sStr.replace(/\s+/g, '') || lbl === sStr.replace(/\s+/g, '');
                })?.value;
            };

            const severity = mapSeverityToValue(typeof rawSeverity === 'string' || typeof rawSeverity === 'number' ? rawSeverity : undefined) ?? (item as Record<string, unknown>).severity;

            const mapped = {
                ...(item as Record<string, unknown>),
                caseNo,
                asset,
                center,
                incidentDate,
                symptoms,
                status,
                severity
            } as IncidentReportDto;

            if (idx < 5) console.log('[HomePage] mapped item', idx, mapped);
            return mapped;
        };

        const load = async () => {
            setLoading(true);
            setError(null);
            console.log('[HomePage] load start');
            try {
                const data: unknown = await getIncidentReports();
                console.log('[HomePage] API raw data =', data);
                const listRaw = normalizeResponse(data);
                console.log('[HomePage] listRaw length =', listRaw.length);
                const list = listRaw.map((it, i) => normalizeIncident(it, i));
                console.log('[HomePage] final list length =', list.length);
                if (mounted) {
                    setIssues(list);
                    console.log('[HomePage] setIssues done');
                } else {
                    console.log('[HomePage] skip setIssues, unmounted');
                }
            } catch (err: unknown) {
                console.error('[HomePage] load error =', err);
                if (mounted) {
                    const message = err instanceof Error ? err.message : 'Failed to load incidents';
                    setError(message);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log('[HomePage] load finished');
                }
            }
        };
        load();
        return () => {
            mounted = false;
            console.log('[HomePage] effect cleanup (unmount)');
        };
    }, []);

    const handleRowClick = (caseNo: string) => {
        navigate(`/issues/${caseNo}`);
    };

    // Filtered issues
    const filteredIssues = issues.filter(issue => {
        const titleMatch = !search || (issue.title ?? '').toLowerCase().includes(search.toLowerCase());
        const statusMatch = !filterStatus || String(issue.status ?? '') === filterStatus;
        const severityMatch = !filterSeverity || String(issue.severity ?? '') === filterSeverity;
        const domainMatch = !filterDomain || String(issue.domain ?? '').toLowerCase() === filterDomain.toLowerCase(); // Add domain filter logic
        return titleMatch && statusMatch && severityMatch && domainMatch;
    });

    return (
        <Container maxWidth={false} disableGutters>
            <Box sx={{ my: 4 }}>
                
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        flexDirection: { xs: 'row', sm: 'row' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            flex: 1,
                            minWidth: 0,
                            width: '100%',
                        }}
                    >
                        <TextField
                            label="Search Title"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 300 }, minWidth: 0 }}
                        />
                        {/* ปรับให้ปุ่มเป็นไอคอนทุกขนาดหน้าจอ */}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={isFilterActive ? handleClearFilter : () => setFilterDialogOpen(true)}
                            sx={{ minWidth: 0, p: 1, height: 40 }}
                        >
                            {isFilterActive ? <CloseIcon /> : <FilterListIcon />}
                        </Button>
                        <Button
                            component={Link}
                            to="/issues/new"
                            variant="contained"
                            color="primary"
                            sx={{ minWidth: 0, p: 1, height: 40 }}
                        >
                            <AddIcon />
                        </Button>
                        <Dialog
                            open={filterDialogOpen}
                            onClose={() => setFilterDialogOpen(false)}
                            fullWidth
                            maxWidth="xs"
                            PaperProps={{
                                sx: {
                                    position: 'absolute', // หรือ 'fixed' หากต้องการให้มันคงที่
                                    top: 0, // ชิดขอบด้านบน
                                    margin: 0 // ลบ margin เพื่อให้ชิดขอบมากขึ้น
                                }
                            }}
                        >
                            <DialogTitle>Filters</DialogTitle>
                            <DialogContent dividers>
                                <TextField
                                    select
                                    label="Status"
                                    size="small"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    {incidentStatusOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    label="Severity"
                                    size="small"
                                    value={filterSeverity}
                                    onChange={e => setFilterSeverity(e.target.value)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    <MenuItem value="">All Severity</MenuItem>
                                    {severityOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.labelInEn}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    label="Domain" // Add domain filter
                                    size="small"
                                    value={filterDomain}
                                    onChange={e => setFilterDomain(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">All Domains</MenuItem>
                                    {domainOptions.map(opt => (
                                        <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    color="secondary"
                                    onClick={() => {
                                        handleClearFilter();
                                        setFilterDialogOpen(false);
                                    }}
                                >
                                    Clear Filter
                                </Button>
                                <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                </Box>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    
                    {filteredIssues.map((issue, index) => {
                        const caseNo = issue.caseNo ?? (issue.id ? `#${issue.id}` : `#${index}`);
                        const status = issue.status ?? 'Unknown';
                        const statusOption = incidentStatusOptions.find(opt => opt.value === status) ??
                            incidentStatusOptions.find(opt => opt.value === 'Open'); // fallback
                        const paletteColor = getIncidentStatusPaletteColor(statusOption?.value);
                        let iconColor = theme.palette.text.primary;
                        if (paletteColor) {
                            const [mainKey, shadeKey] = paletteColor.split('.');
                            const mainPalette = theme.palette[mainKey as keyof typeof theme.palette];
                            iconColor = (mainPalette && typeof mainPalette === 'object' && shadeKey in mainPalette
                                ? mainPalette[shadeKey as keyof typeof mainPalette]
                                : theme.palette.text.primary);
                        }

                        // compute a formatted incident date (try multiple possible fields)
                        const rawDate = issue.createdUtc;
                        const formattedDate = formatDateTime(rawDate) ?? '';

                        return (
                            <React.Fragment key={caseNo}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleRowClick(caseNo)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                            {/* Status ซ้ายสุด */}
                                            <Box
                                                sx={{
                                                    minWidth: 16, // ปรับให้เล็กลง
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                }}
                                            >
                                                <Tooltip title={statusOption?.label ?? status}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: 32, // ปรับให้เล็กลง
                                                        }}
                                                    >
                                                        <Box sx={{ mb: isMobile ? 0 : 0.5, color: iconColor }}>
                                                            {statusOption?.icon}
                                                        </Box>
                                                        {!isMobile && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ textAlign: 'center', fontWeight: 500 }}
                                                            >
                                                                {statusOption?.label}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                            {/* Title & Secondary (อยู่ตรงกลาง) */}
                                            <ListItemText
                                                sx={{ mx: 2, minWidth: 0 }} // เพิ่ม minWidth: 0 เพื่อให้ Title ยืดได้
                                                primary={
                                                    <>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{ fontWeight: 600, display: 'inline' }}
                                                        >
                                                            {caseNo}
                                                        </Typography>
                                                        {`: ${issue.title ?? ''}`}
                                                    </>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="span"
                                                        >
                                                            Opened By{issue.createdUtc ? `: ${issue.createdUserName}` : ''}{' '}
                                                            {formattedDate ? `| ${formattedDate} ` : ' '}
                                                            {!isMobile && (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    component="span"
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        mt: 0.5,
                                                                    }}
                                                                >
                                                                    <LocalOfferIcon
                                                                        fontSize="small"
                                                                        sx={{ mr: 0.5 }}
                                                                    />{' '}
                                                                    {getDomainLabel(issue.domain)}
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            {/* Severity ขวาสุด */}
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 0 }}>
                                                <Chip
                                                    label={isMobile ? getSeverityLetter(issue.severity) : getSeverityLabelEn(issue.severity) || '-'}
                                                    color={getSeverityColor(issue.severity)}
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </Box>
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                                {index < issues.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>
        </Container>
    );
}

export default HomePage;
