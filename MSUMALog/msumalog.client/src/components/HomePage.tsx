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
    Alert
} from '@mui/material';
import { getIncidentReports } from '../api/client';
import type { IncidentReportDto } from '../api/client';

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
    const navigate = useNavigate();

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

            const status =
                item.status ??
                item.state ??
                item.current_status ??
                (item.closed ? 'Closed' : 'In Progress');

            const mapped: IncidentReportDto = {
                ...(item as Record<string, unknown>),
                case_no,
                asset,
                center,
                incident_date,
                symptoms,
                status
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
        navigate(`/issues/detail/${caseNo}`);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Issue List
                </Typography>
                <Button
                    component={Link}
                    to="/issues/new"
                    variant="contained"
                    color="primary"
                    sx={{ mb: 2 }}
                >
                    New
                </Button>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    
                    {issues.map((issue, index) => {
                        const caseNo = issue.case_no ?? (issue.id ? `#${issue.id}` : `#${index}`);
                        const status = issue.status ?? 'Unknown';
                        return (
                            <React.Fragment key={caseNo}>
                                <ListItem
                                    disablePadding
                                    secondaryAction={
                                        <Chip label={status} color={status === 'Closed' ? 'default' : 'warning'} />
                                    }
                                >
                                    <ListItemButton onClick={() => handleRowClick(caseNo)}>
                                        <ListItemText
                                            primary={`${caseNo}: ${issue.asset ?? ''} (${issue.center ?? ''})`}
                                            secondary={issue.symptoms ?? ''}
                                        />
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
