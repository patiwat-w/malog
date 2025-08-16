import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, Stack, Divider, TextField, Button, MenuItem,
  IconButton, Tooltip
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { getIncidentByCase, updateIncidentFull, type IncidentReportDto } from '../api/client';
import { getDomainLabel, getSeverityLabel, getSeverityColor } from '../constants/incidentOptions';
import IncidentConversation from './IncidentConversation';
import { incidentStatusOptions } from '../constants/incidentOptions'; // เพิ่มบรรทัดนี้

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const parseToDate = (value: unknown): Date | null => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    let n = value;
    if (n < 1e12) n = n * 1000;
    const d = new Date(n);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    const msMatch = /\/Date\((\-?\d+)\)\//.exec(s);
    if (msMatch) {
      const n = parseInt(msMatch[1], 10);
      const d = new Date(n);
      return isNaN(d.getTime()) ? null : d;
    }
    if (/^\-?\d+$/.test(s)) {
      let n = parseInt(s, 10);
      if (n < 1e12) n = n * 1000;
      const d = new Date(n);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

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

interface Incident extends Omit<IncidentReportDto,
  'additional_info' | 'responsible_name' | 'responsible_lineid' | 'responsible_email' | 'responsible_phone'> {
  id: number;
}

const IncidentReportDetail: React.FC = () => {
  const { case_no } = useParams<{ case_no: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const DetailField: React.FC<{ label: string; children: React.ReactNode; color?: string }> = ({ label, children, color }) => {
    const isSeverity = label.toLowerCase() === 'severity';
    const isChipField = ['impact', 'domain', 'sub-domain'].includes(label.toLowerCase());
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

        {isSeverity && incident?.severity ? (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={getSeverityLabel(incident.severity) || '-'}
              color={getSeverityColor(incident.severity)}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        ) : isChipField ? (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={children || '-'}
              color="warning"
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
              bgcolor: color || 'background.default', // เพิ่มตรงนี้
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
          caseNo: data.caseNo || '',
          title: data.title || '',
          status: data.status || '',
          asset: data.asset || '',
          center: data.center || '',
          incidentDate: data.incidentDate || '',
          symptoms: data.symptoms || '',
          severity: data.severity ?? undefined,
          impact: data.impact || '',
          domain: data.domain || '',
          subDomain: data.subDomain || '',
          vendor: data.vendor || '',
          manufacturer: data.manufacturer || '',
          partNumber: data.partNumber || '',
          interimAction: data.interimAction || '',
          intermediateAction: data.intermediateAction || '',
          longTermAction: data.longTermAction || '',
          createdUtc: data.createdUtc || '',
          createdUserName: data.createdUserName || '',
          updatedUtc: data.updatedUtc || '',
          updatedUserName: data.updatedUserName || '',
         
          // Map other fields as needed
          id: data.id ?? 0
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
        caseNo: incident.caseNo,
        status,
        asset: incident.asset,
        center: incident.center,
        incidentDate: incident.incidentDate,
        symptoms: incident.symptoms,
        severity: incident.severity,
        impact: incident.impact,
        domain: incident.domain,
        subDomain: incident.subDomain,
        vendor: incident.vendor,
        manufacturer: incident.manufacturer,
        partNumber: incident.partNumber,
        interimAction: incident.interimAction,
        intermediateAction: incident.intermediateAction,
        longTermAction: incident.longTermAction,
        createdUtc: incident.createdUtc,
        title: incident.title
      });
      setIncident(prev => prev ? { ...prev, status } : prev);
    } finally {
      setSubmitting(false);
    }
  };

  if (!incident) {
    return <Typography sx={{ mt: 4 }}>Loading incident...</Typography>;
  }

  const formattedCreatedUtc = formatDateTime(incident.createdUtc) ?? incident.createdUtc ?? '';

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
            Issue #{incident.caseNo}
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
          {(() => {
            const statusOption = incidentStatusOptions.find(opt => opt.value === incident.status);
            return (
              <Chip
                icon={React.isValidElement(statusOption?.icon) ? statusOption?.icon : undefined}
                label={statusOption?.label || incident.status}
                color={statusOption?.color ?? 'default'}
                size="small"
                sx={{ fontWeight: 700, ml: 'auto' }}
              />
            );
          })()}
        </Stack>

        <Tooltip title="Edit Issue">
          <IconButton
            aria-label="edit issue"
            color="primary"
            onClick={() => navigate(`/issues/${incident.caseNo}/edit`)}
            size="small"
          >
            <EditOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Created by <strong>{incident.createdUserName}</strong> &nbsp;|&nbsp; Report Date: {formattedCreatedUtc}
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
 
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <DetailField label="Severity">{getSeverityLabel(incident.severity ?? 0)}</DetailField>
          <DetailField label="Impact">{incident.impact}</DetailField>
          <DetailField label="Domain">{getDomainLabel(incident.domain)}</DetailField>
          <DetailField label="Sub-domain">{incident.subDomain}</DetailField>
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
          <DetailField label="Interim">{incident.interimAction}</DetailField>
          <DetailField label="Intermediate">{incident.intermediateAction}</DetailField>
          <DetailField label="Long-term">{incident.longTermAction}</DetailField>
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
          {incidentStatusOptions.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {opt.icon}
                {opt.label}
              </Box>
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          disabled={status === incident.status || submitting}
          onClick={handleSubmitAction}
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
          startIcon={
            (() => {
              const btnOpt = incidentStatusOptions.find(opt => opt.value === status);
              return btnOpt?.icon ?? null;
            })()
          }
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

      {incident.caseNo && <IncidentConversation caseNo={incident.caseNo} incidentId={incident.id} />}
    </Paper>
  );
};

export default IncidentReportDetail;