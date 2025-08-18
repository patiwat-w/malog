import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, Stack, Divider, TextField, Button, MenuItem,
  IconButton, Tooltip, Avatar
} from '@mui/material';
import { Grid } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { getIncidentByCase, updateIncidentFull, getCurrentUser, type IncidentReportDto, type User } from '../api/client';
import IncidentConversation from '../components/IncidentConversation';
import { getDomainLabel, getSeverityLabel, getSeverityColor } from '../constants/incidentOptions';
import { incidentStatusOptions } from '../constants/incidentOptions'; 
import WysiwygMarkdownEditor from '../components/WysiwygMarkdownEditor'; // เพิ่ม import นี้

// --- NEW imports for dialogs / backdrop / snackbar / alert ---
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


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
    let s = value.trim();
    if (!s) return null;

    // ตรวจสอบและแปลงปี พ.ศ. เป็น ค.ศ.
    const thaiYearMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/.exec(s);
    if (thaiYearMatch) {
      const year = parseInt(thaiYearMatch[1], 10);
      if (year > 2400) {
        // แปลงปี พ.ศ. เป็น ค.ศ.
        const convertedYear = year - 543;
        s = s.replace(String(year), String(convertedYear));
      }
    }

    // default: let JS parse (ISO string with Z/offset)
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDateTime = (value: unknown): string | undefined => {
  const d = parseToDate(value);
  if (!d) return undefined;
  // ใช้ local timezone ของเครื่อง user
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// --- new helper utilities for contact chips ---
const sanitizePhone = (v?: string) => {
  if (!v) return '';
  // keep digits and plus sign for international numbers
  return v.replace(/[^+\d]/g, '');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getContactChipProps = (type: 'email' | 'phone' | 'line', value?: string): Record<string, any> => {
  if (!value) {
    return { component: 'div', clickable: false };
  }
  if (type === 'email') {
    return { component: 'a', href: `mailto:${value}`, clickable: true };
  }
  if (type === 'phone') {
    const tel = sanitizePhone(value);
    return { component: 'a', href: `tel:${tel}`, clickable: !!tel };
  }
  // line
  // remove leading @ if present, then build a "add/chat" url; open in new tab
  const id = value.startsWith('@') ? value.slice(1) : value;
  const lineUrl = `https://line.me/ti/p/~${encodeURIComponent(id)}`;
  return { component: 'a', href: lineUrl, target: '_blank', rel: 'noopener noreferrer', clickable: true };
};
// --- end helpers ---

interface Incident extends Omit<IncidentReportDto,
  'additional_info' | 'responsible_name' | 'responsible_lineid' | 'responsible_email' | 'responsible_phone'> {
  id: number;
  // เพิ่มฟิลด์ที่ UI ใช้ แต่ยังไม่ได้แมป/ไทป์
  additionalInfo?: string;
  responsibleName?: string;
  responsibleLineId?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
}

const IncidentReportDetail: React.FC = () => {
  const { case_no } = useParams<{ case_no: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- NEW UI state ---
  const [loading, setLoading] = useState(false); // PageLoad when calling API
  const [confirmOpen, setConfirmOpen] = useState(false); // ConfirmDialog before API
  const [snackOpen, setSnackOpen] = useState(false); // SnackAlert on success
  const [snackMessage, setSnackMessage] = useState(''); 
  const [errorOpen, setErrorOpen] = useState(false); // AlertDialog on error
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // --- end new state ---

  const DetailField: React.FC<{ label: string; children: React.ReactNode; color?: string }> = ({ label, children, color }) => {
    const isSeverity = label.toLowerCase() === 'severity';
    const isChipField = ['impact', 'domain', 'sub-domain','asset','center','vendor','manufacturer','part-number','incident-date'].includes(label.toLowerCase());

    return (
      // make each field take full width of its grid cell and stack label+content vertically
      <Box sx={{ width: '100%', mb: { xs: 1.25, sm: 0 } }}>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            fontWeight: 700,
            letterSpacing: '.6px',
            color: 'text.secondary',
            textTransform: 'uppercase',
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
              sx={{ fontWeight: 700, px: 1.2, py: 0.4 }}
            />
          </Box>
        ) : isChipField ? (
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={children || '-'}
              variant="outlined"
              color="info"
              size="small"
              sx={{ fontWeight: 700, px: 1.2 }}
            />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              mt: 0.5,
              p: 1.25,
              bgcolor: color || 'background.paper',
              borderLeft: 4,
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 52,
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
      setLoading(true); // show PageLoad while fetching
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
          // เพิ่ม mapping ของฟิลด์ที่ยังขาด
          additionalInfo: data.additionalInfo || '',
          responsibleName: data.responsibleName ?? '',
          responsibleLineId: data.responsibleLineId ?? '',
          responsibleEmail: data.responsibleEmail ?? '',
          responsiblePhone: data.responsiblePhone ?? '',
         
          // Map other fields as needed
          id: data.id ?? 0
        };
        setIncident(mapped);
        setStatus(mapped.status ?? '');
      } catch (e) {
        console.error(e);
        setErrorMessage(String((e as Error)?.message ?? 'Failed to load incident'));
        setErrorOpen(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [case_no]);

  useEffect(() => {
    // Fetch current user on mount
    (async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        console.error(e);
        setCurrentUser(null);
      }
    })();
  }, []);

  // Replace direct submit with confirm flow
  const handleSubmitAction = async () => {
    if (!incident) return;
    const statusChanged = status !== incident.status;
    if (!statusChanged) return;
    // open confirm dialog
    setConfirmOpen(true);
  };

  // perform update after confirmation
  const performUpdate = async () => {
    if (!incident) return;
    setConfirmOpen(false);
    setSubmitting(true);
    setLoading(true);
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
      setSnackMessage('Status updated successfully');
      setSnackOpen(true);
    } catch (e) {
      console.error(e);
      setErrorMessage(String((e as Error)?.message ?? 'Failed to update incident'));
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  if (!incident) {
    return <Typography sx={{ mt: 4 }}>Loading incident...</Typography>;
  }

  const formattedCreatedUtc = formatDateTime(incident.createdUtc) ?? incident.createdUtc ?? '';

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, mt: 3, maxWidth: 1200, mx: 'auto', borderRadius: 3, boxShadow: 3 }}>
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
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '0.95rem' }}>
            {String(incident.caseNo || '').slice(-2)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Issue #{incident.caseNo}
            </Typography>
            {incident.title && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  maxWidth: { xs: '100%', sm: 520 },
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
          </Box>

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
        Created by <strong>{incident.createdUserName}</strong> &nbsp;|&nbsp; <AccessTimeIcon sx={{ fontSize: '0.8rem' }}/> {formattedCreatedUtc}
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
            width: 6,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            bgcolor: 'primary.main',
            opacity: 0.18
          }
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '.6px' }}>
          Symptoms (อาการที่พบ)
        </Typography>
        <WysiwygMarkdownEditor value={incident.symptoms} readOnly minHeight={100} />
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
 
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid  >
            <DetailField label="Severity">{getSeverityLabel(incident.severity ?? 0)}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Impact">{incident.impact}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Domain">{getDomainLabel(incident.domain)}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Sub-domain">{incident.subDomain}</DetailField>
          </Grid>
          <Grid>
  <DetailField label="Incident-date">
    <Box>

      <Typography variant="body2" color="primary">
      {formatDateTime(incident.incidentDate) || '-'}
      </Typography>
    </Box>
  </DetailField>
</Grid>
        </Grid>
      </Box>

      {/* New Box: Asset / Hardware Details (moved out from Meta Fields) */}
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
        <Typography variant="overline" sx={{ fontWeight: 600, mb: 1 }}>
          Asset & Vendor (ข้อมูลสินทรัพย์และผู้จัดจำหน่าย)
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
           <Grid  >
              <DetailField label="Asset">{incident.asset}</DetailField>
                    
          </Grid>
          <Grid  >
            <DetailField label="Center">{incident.center}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Vendor">{incident.vendor}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Manufacturer">{incident.manufacturer}</DetailField>
          </Grid>
          <Grid  >
            <DetailField label="Part-number">{incident.partNumber}</DetailField>
          </Grid>
        </Grid>
      </Box>

      {/* Responsible Box - moved out from Meta Fields */}
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
        <Typography variant="overline" sx={{ fontWeight: 600, mb: 1 }}>
          Responsible/Coordinator (ผู้ประสานงาน)
        </Typography>

        {/* compact contact chips with icons and optional click */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            icon={<PersonOutlineIcon />}
            label={incident.responsibleName || '-'}
            size="small"
            sx={{ fontWeight: 600 }}
          />

          {/* Line chip: opens Line chat/profile in a new tab when available */}
          <Chip
            icon={<ChatBubbleOutlineIcon />}
            label={incident.responsibleLineId || '-'}
            size="small"
            sx={{ fontWeight: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(getContactChipProps('line', incident.responsibleLineId) as any)}
          />

          {/* Email chip: mailto: */}
          <Chip
            icon={<EmailOutlinedIcon />}
            label={incident.responsibleEmail || '-'}
            size="small"
            sx={{ fontWeight: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(getContactChipProps('email', incident.responsibleEmail) as any)}
          />

          {/* Phone chip: tel: (sanitized) */}
          <Chip
            icon={<PhoneOutlinedIcon />}
            label={incident.responsiblePhone || '-'}
            size="small"
            sx={{ fontWeight: 600 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(getContactChipProps('phone', incident.responsiblePhone) as any)}
          />
        </Box>
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

        <Grid container direction="column" spacing={2} sx={{ mt: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Interim Action</Typography>
        <WysiwygMarkdownEditor value={incident.interimAction} readOnly minHeight={100} />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Intermediate Action</Typography>
        <WysiwygMarkdownEditor value={incident.intermediateAction} readOnly minHeight={100} />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Long-term Action</Typography>
        <WysiwygMarkdownEditor value={incident.longTermAction} readOnly minHeight={100} />
        </Box>
      </Grid>
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
          onClick={handleSubmitAction} // now opens confirm dialog
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

      {incident.caseNo && currentUser && (
        <IncidentConversation
          caseNo={incident.caseNo}
          incidentId={incident.id}
          currentUser={currentUser}
        />
      )}

      {/* --- PageLoad (Backdrop) --- */}
      <Backdrop open={loading} sx={{ zIndex: theme => theme.zIndex.drawer + 1, color: '#fff' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <CircularProgress color="inherit" />
          <Typography>Loading...</Typography>
        </Box>
      </Backdrop>

      {/* --- ConfirmDialog before API call --- */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to update status to "{status}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={performUpdate} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- SnackAlert on success --- */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackOpen(false)} severity="success" elevation={6} variant="filled">
          {snackMessage}
        </MuiAlert>
      </Snackbar>

      {/* --- AlertDialog on error --- */}
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <MuiAlert severity="error" elevation={0}>{errorMessage}</MuiAlert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default IncidentReportDetail;