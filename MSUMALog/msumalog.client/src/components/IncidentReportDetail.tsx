import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, Stack, Divider, TextField, Button, MenuItem,
  IconButton, Tooltip
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { getIncidentByCase, updateIncidentFull, type IncidentReportDto } from '../api/client';
import { getDomainLabel, getSeverityLabel } from '../constants/incidentOptions';
import IncidentConversation from './IncidentConversation';

interface Incident extends Omit<IncidentReportDto,
  'additional_info' | 'responsible_name' | 'responsible_lineid' | 'responsible_email' | 'responsible_phone'> {
  id: number;
}

const statusOptions = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

const IncidentReportDetail: React.FC = () => {
  const { case_no } = useParams<{ case_no: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const severityColorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    Low: 'primary',
    Medium: 'warning',
    High: 'error',
    Critical: 'error'
  };

  const getStatusChipColor = (s: string) => {
    if (!s) return 'default' as const;
    if (s === 'Resolved' || s === 'Closed') return 'success' as const;
    if (s === 'In Progress' || s === 'Pending') return 'warning' as const;
    if (s === 'Open') return 'primary' as const;
    return 'default' as const;
  };

  const DetailField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
    const childText = typeof children === 'string' ? children : undefined;
    const isSeverity = label.toLowerCase() === 'severity';
    return (
      <Box sx={{ minWidth: { xs: '48%', sm: 160 }, flexGrow: 1, mb: { xs: 1.25, sm: 0 } }}>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            fontWeight: 700,
            letterSpacing: '.6px',
            color: 'text.secondary',
            textTransform: 'uppercase',
            backgroundColor: 'rgba(0,0,0,0.03)',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            mb: 0.5
          }}
        >
          {label}
        </Typography>

        {isSeverity && childText ? (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={childText || '-'}
              color={severityColorMap[childText ?? ''] ?? 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              mt: 0.5,
              p: 1,
              bgcolor: 'background.default',
              borderLeft: '4px solid',
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography sx={{ fontSize: '.95rem', fontWeight: 500, color: 'text.primary', wordBreak: 'break-word' }}>
              {children || '-'}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (!case_no) return;
    (async () => {
      try {
        const data = await getIncidentByCase(case_no);
        if (!data) return;
        const mapped: Incident = {
          case_no: data.case_no || '',
          title: data.title || '',
          status: data.status || '',
          asset: data.asset || '',
          center: data.center || '',
          incident_date: data.incident_date || '',
          symptoms: data.symptoms || '',
          severity: data.severity ?? undefined,   // อย่าใส่ '' ให้คง number หรือ undefined
          impact: data.impact || '',
          domain: data.domain || '',
          sub_domain: data.sub_domain || '',
          vendor: data.vendor || '',
          manufacturer: data.manufacturer || '',
          part_number: data.part_number || '',
          interim_action: data.interim_action || '',
          intermediate_action: data.intermediate_action || '',
          long_term_action: data.long_term_action || '',
          created_by: data.created_by || '',
          id: data.id ?? 0,
          incidentDate: data.incident_date || '' // Add occurredAt property
        };
        setIncident(mapped);
        setStatus(mapped.status ?? '');
      } catch (e) {
        console.error(e);
      }
    })();
  }, [case_no]);

  const handleSubmitAction = async () => {
    if (!incident) return;
    const statusChanged = status !== incident.status;
    if (!statusChanged) return;
    setSubmitting(true);
    try {
      await updateIncidentFull({
        id: incident.id,
        case_no: incident.case_no,
        status,
        asset: incident.asset,
        center: incident.center,
        incident_date: incident.incident_date,
        symptoms: incident.symptoms,
        severity: incident.severity,
        impact: incident.impact,
        domain: incident.domain,
        sub_domain: incident.sub_domain,
        vendor: incident.vendor,
        manufacturer: incident.manufacturer,
        part_number: incident.part_number,
        interim_action: incident.interim_action,
        intermediate_action: incident.intermediate_action,
        long_term_action: incident.long_term_action,
        created_by: incident.created_by,
        title: incident.title,
        incidentDate: incident.incident_date ?? '' // Ensure incidentDate is included
      });
      setIncident(prev => prev ? { ...prev, status } : prev);
    } finally {
      setSubmitting(false);
    }
  };

  if (!incident) {
    return <Typography sx={{ mt: 4 }}>Loading incident...</Typography>;
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mr: 1, whiteSpace: 'nowrap' }}>
            Issue #{incident.case_no}
          </Typography>
          {incident.title && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                maxWidth: { xs: '100%', sm: 480 },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'text.secondary'
              }}
              title={incident.title}
            >
              {incident.title}
            </Typography>
          )}
          <Chip
            label={incident.status}
            color={getStatusChipColor(incident.status || '')}
            size="small"
            sx={{ fontWeight: 700, ml: 'auto' }}
          />
        </Stack>

        <Tooltip title="Edit Issue">
          <IconButton
            aria-label="edit issue"
            color="primary"
            onClick={() => navigate(`/issues/${incident.case_no}/edit`)}
            size="small"
          >
            <EditOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Created by <strong>{incident.created_by}</strong> &nbsp;|&nbsp; Report Date: {incident.incident_date}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Symptoms */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          position: 'relative',
          bgcolor: 'background.default',
          '&:before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            bgcolor: 'primary.main',
            opacity: 0.4
          }
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          Symptoms
        </Typography>
        <Typography sx={{ mt: .5, fontSize: '.95rem' }}>
          {incident.symptoms || '-'}
        </Typography>
      </Box>

      {/* Meta Fields */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600 }}>
          Details
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <DetailField label="Severity">{getSeverityLabel(incident.severity ?? 0)}</DetailField>
          <DetailField label="Impact">{incident.impact}</DetailField>
          <DetailField label="Domain">{getDomainLabel(incident.domain)}</DetailField>
          <DetailField label="Sub-domain">{incident.sub_domain}</DetailField>
        </Stack>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 600 }}>
          Actions
        </Typography>
        <Stack spacing={1.2} sx={{ mt: 1 }}>
          <DetailField label="Interim">{incident.interim_action}</DetailField>
          <DetailField label="Intermediate">{incident.intermediate_action}</DetailField>
          <DetailField label="Long-term">{incident.long_term_action}</DetailField>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>Status Update</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 200 } }}
        >
          {statusOptions.map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          disabled={status === incident.status || submitting}
          onClick={handleSubmitAction}
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
        >
          {(() => {
            let buttonText = 'No Change';
            if (submitting) {
              buttonText = 'Saving...';
            } else if (status !== incident.status) {
              buttonText = 'Update Status';
            }
            return buttonText;
          })()}
        </Button>
      </Stack>

      {incident.case_no && <IncidentConversation caseNo={incident.case_no} incidentId={incident.id} />}
    </Paper>
  );
};

export default IncidentReportDetail;