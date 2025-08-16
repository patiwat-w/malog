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
    MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getIncidentReports } from '../api/client';
import type { IncidentReportDto } from '../api/client';
import {
    getSeverityLabel,
    getSeverityColor,
    incidentStatusOptions,
    getIncidentStatusLabel,
    getIncidentStatusColor,
    getIncidentStatusPaletteColor,
    severityOptions
} from '../constants/incidentOptions';
import Tooltip from '@mui/material/Tooltip';

// Add raw incident shape
type RawIncident = {
    case_no?: string;
    caseNo?: string;
    caseId?: string;
    caseNumber?: string;
    id?: string | number;
    asset?: string;
    device?: string;
    asset_name?: string;
    equipment?: string;
    center?: string;
    hospital?: string;
    center_name?: string;
    location?: string;
    incident_date?: string;
    date?: string;
    incidentDate?: string;
    reported_at?: string;
    symptoms?: string;
    description?: string;
    symptom?: string;
    issue_description?: string;
    status?: string;
    state?: string;
    current_status?: string;
    closed?: boolean;
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
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

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
            const case_no =
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

            const incident_date =
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

            const status = mapStatusToValue(rawStatus) ?? rawStatus;

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

            const mapped: IncidentReportDto = {
                ...(item as Record<string, unknown>),
                case_no,
                asset,
                center,
                incident_date,
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
        return titleMatch && statusMatch && severityMatch;
    });

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                        <TextField
                            label="Search Title"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 300 }, minWidth: 0 }}
                        />
                        <TextField
                            select
                            label="Status"
                            size="small"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            sx={{ width: { xs: '48%', sm: 160 } }}
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
                            sx={{ width: { xs: '48%', sm: 140 } }}
                        >
                            <MenuItem value="">All Severity</MenuItem>
                            {severityOptions.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <Button
                            variant="outlined"
                            color="secondary"
                            sx={{ height: 40, width: { xs: '100%', sm: 'auto' } }}
                            onClick={() => {
                                setSearch('');
                                setFilterStatus('');
                                setFilterSeverity('');
                            }}
                        >
                            Clear Filter
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 'auto', alignSelf: 'flex-end', mt: { xs: 1, sm: 0 } }}>
                        <Button
                            component={Link}
                            to="/issues/new"
                            variant="contained"
                            color="primary"
                            sx={{ width: 'auto' }}
                        >
                            New issue
                        </Button>
                    </Box>
                </Box>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    
                    {filteredIssues.map((issue, index) => {
                        const caseNo = issue.case_no ?? (issue.id ? `#${issue.id}` : `#${index}`);
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

                        return (
                            <React.Fragment key={caseNo}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleRowClick(caseNo)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                            <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'flex-start' }}>
                                                <Tooltip title={statusOption?.label ?? status}>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 80,
                                                    }}>
                                                        <Box sx={{ mb: 0.5, color: iconColor }}>
                                                            {statusOption?.icon}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 500 }}>
                                                            {statusOption?.label}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                            <ListItemText
                                              primary={
                                                <>
                                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'inline' }}>
                                                    {caseNo}
                                                  </Typography>
                                                  {`: ${issue.title ?? ''}`}
                                                </>
                                              }
                                              secondary={
                                                <>
                                                  <Typography variant="body2" color="text.secondary" component="span">
                                                    Opened By{issue.created_by ? `: ${issue.created_by}` : ''} {issue.incident_date ? `| ${issue.incident_date}` : ''}
                                                  </Typography>
                                                </>
                                              }
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 2 }}>
                                            <Chip
                                                label={getSeverityLabel(issue.severity) || '-'}
                                                color={getSeverityColor(issue.severity)}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
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
