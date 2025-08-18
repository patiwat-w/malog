/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, MenuItem, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './IncidentReportForm.css'; // เพิ่ม (ถ้ายังไม่ได้ import)
import { createIncident as apiCreateIncident, getIncidentByCase, updateIncidentFull, getCurrentUser } from '../api/client'; // เพิ่ม import
import type { IncidentReportDto } from '../api/client';
import { domainOptions, severityOptions, incidentStatusOptions } from '../constants/incidentOptions'; // <-- refactored import

import ConfirmDialog from "../components/ConfirmDialog";

import PageLoading from "../components/PageLoading"; // <-- added
import SnackbarAlert from "../components/SnackbarAlert"; // <-- added
import AlertDialog from "../components/AlertDialog"; // <-- added
import WysiwygMarkdownEditor from '../components/WysiwygMarkdownEditor'; // <-- added

interface IFormData {
    id?: number;                 // <-- เพิ่ม id
    caseNo: string;
    title: string;               // NEW
    asset: string;
    center: string;
    incidentDate: string;
    symptoms: string;
    severity: string;
    impact: string;
    domain: string; // จะเก็บ code เช่น '001'
    subDomain: string;
    vendor: string;
    manufacturer: string;
    partNumber: string;
    additionalInfo: string;
    interimAction: string;
    intermediateAction: string;
    longTermAction: string;
    status: string;
    // added responsible person fields
    responsibleName: string;
    responsibleLineId: string;
    responsibleEmail: string;
    responsiblePhone: string;
}

const IncidentReportForm: React.FC = () => {
    // accept either :caseNo or :case_no route param to be robust
    const params = useParams<Record<string, string | undefined>>();
    const caseNoFromUrl = params.caseNo ?? params['case_no'];
    const navigate = useNavigate();
    const isEdit = !!caseNoFromUrl;

    const today = new Date();
    //const isoNow = formatDate(today, "yyyy-MM-dd'T'HH:mm:ss"); // include time

    const [formData, setFormData] = useState<IFormData>({
        id: undefined,
        caseNo: '',
        title: '',            // NEW
        asset: '',
        center: '',
        incidentDate: '',           // <-- changed: keep incidentDate empty during editing; use pickers instead
        symptoms: '',
        severity: '',
        impact: '',
        domain: '',
        subDomain: '',
        vendor: '',
        manufacturer: '',
        partNumber: '',
        additionalInfo: '',
        interimAction: '',
        intermediateAction: '',
        longTermAction: '',
        status: '',
        // initialize new fields
        responsibleName: '',
        responsibleLineId: '',
        responsibleEmail: '',
        responsiblePhone: ''
    });

    const [originalFormData, setOriginalFormData] = useState<IFormData | null>(null);

    useEffect(() => {
        // ดึงข้อมูล user มาเติม default
        getCurrentUser()
            .then(user => {
                if (user) {
                    setFormData(f => ({
                        ...f,
                        responsibleEmail: user.email ?? '', // coerce to string to match IFormData
                        responsibleName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    }));
                }
            })
            .catch(() => { /* ไม่ต้องเติมอะไรถ้า error */ });
    }, []);
    
    // Date object for the pickers (separate date & time)
    const [incidentDateOnly, setIncidentDateOnly] = useState<Date | null>(today);
    const [incidentTimeOnly, setIncidentTimeOnly] = useState<Date | null>(today);

    // NEW: api states
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);   // <-- เพิ่ม

    // NEW: state สำหรับยืนยันการส่งแทน window.confirm
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [pendingDto, setPendingDto] = useState<Partial<IncidentReportDto> | null>(null);

    // NEW: Snackbar / AlertDialog states
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogTitle, setErrorDialogTitle] = useState('');
    const [errorDialogMessage, setErrorDialogMessage] = useState('');

    useEffect(() => {
        let ignore = false;
        const load = async () => {
            if (!caseNoFromUrl) {
                setFormData(f => ({
                    ...f,
                    status: f.status || 'Open'
                }));
                return;
            }
            setLoading(true);
            setApiError(null);
            try {
                const dto = await getIncidentByCase(caseNoFromUrl);
                if (ignore) return;
                // set form fields (keep incidentDate in formData for reference/audit but
                // set pickers separately so editing uses the picker state)
                setFormData(prev => {
                    // ถ้า id เหมือนเดิม ไม่ต้องเซ็ตใหม่
                    if (prev.id === dto.id) return prev;
                    return {
                        id: dto.id,
                        caseNo: dto.caseNo || caseNoFromUrl,
                        title: dto.title || dto.caseNo || 'Untitled',
                        asset: dto.asset || '',
                        center: dto.center || '',
                        incidentDate: dto.incidentDate || '', // keep server value but do not update on picker changes
                        symptoms: dto.symptoms || '',
                        severity: String(dto.severity ?? ''),
                        impact: dto.impact || '',
                        domain: dto.domain || '',
                        subDomain: dto.subDomain || '',
                        vendor: dto.vendor || '',
                        manufacturer: dto.manufacturer || '',
                        partNumber: dto.partNumber || '',
                        additionalInfo: dto.additionalInfo || '',
                        interimAction: dto.interimAction || '',
                        intermediateAction: dto.intermediateAction || '',
                        longTermAction: dto.longTermAction || '',
                        status: dto.status || '',
                        responsibleName: dto.responsibleName || '',
                        responsibleLineId: dto.responsibleLineId || '',
                        responsibleEmail: dto.responsibleEmail || '',
                        responsiblePhone: dto.responsiblePhone || ''
                    };
                });

                // initialize pickers from dto.incidentDate (if valid)
                if (dto.incidentDate) {
                    const d = new Date(dto.incidentDate);
                    if (!isNaN(d.getTime())) {
                        setIncidentDateOnly(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                        setIncidentTimeOnly(new Date(1970, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
                    } else {
                        setIncidentDateOnly(null);
                        setIncidentTimeOnly(null);
                    }
                } else {
                    // fallback for old data: default to today
                    setIncidentDateOnly(today);
                    setIncidentTimeOnly(today);
                }
            } catch (e: any) {
                if (!ignore) setApiError(e?.response?.data?.message || e?.message || 'Load failed');
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        load();
        return () => { ignore = true; };
    }, [caseNoFromUrl]);

    useEffect(() => {
        if (!isEdit) { // เฉพาะ create เท่านั้น
            getCurrentUser()
                .then(user => {
                    if (user) {
                        setFormData(f => ({
                            ...f,
                            responsibleEmail: user.email ?? '',           // coerce to string
                            responsibleName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        }));
                    }
                    
                })
                .catch(() => { /* ไม่ต้องเติมอะไรถ้า error */ });
        }
    }, [isEdit]);

    useEffect(() => {
        if (isEdit && formData.id) {
            setOriginalFormData(formData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.id]);

    const isFormChanged = isEdit && originalFormData
        ? JSON.stringify({ ...formData, incidentDate: undefined }) !== JSON.stringify({ ...originalFormData, incidentDate: undefined })
        : true;

    // keep separate date & time pickers in sync with formData.incidentDate (parse ISO/date-only)
    // remove the effect that synced formData.incidentDate -> pickers
    // (DO NOT add it back). Pickers and formData are now separate during editing.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        } as unknown as IFormData));
    };

    // Add: helper to produce sx for TextField / MUI inputs (keeps font/spacing)
    const getSxFor = (key: keyof IFormData, extraSx = {}) => {
        const base = { '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } };
        // treat incidentDate specially (based on picker state)
        const isFilled = key === 'incidentDate'
            ? !!incidentDateOnly
            : (typeof formData[key] === 'string' && formData[key].trim().length > 0);
        if (isFilled) {
            return {
                ...base,
                // CSS class will handle background; preserve base sizing here
                ...extraSx
            };
        }
        return { ...base, ...extraSx };
    };

    // New: return class name for the input element (textarea/input)
    const getClassFor = (key: keyof IFormData) => {
        const isFilled = key === 'incidentDate'
            ? !!incidentDateOnly
            : (typeof formData[key] === 'string' && formData[key].trim().length > 0);
        return isFilled ? 'input-field filled' : 'input-field';
    };

    // Change: type keys as keyof IFormData so TS knows valid property names
    // Change required fields: remove incidentDate (we validate pickers separately)
    const requiredFields: Array<{ key: keyof IFormData; label: string }> = [
        { key: 'title', label: 'Title' },
        { key: 'asset', label: 'Asset' },
        { key: 'center', label: 'Center' },
        // incidentDate removed from here
        { key: 'symptoms', label: 'Symptoms' },
        { key: 'severity', label: 'Severity' },
        { key: 'domain', label: 'Problem Domain' },            // <-- added required
        { key: 'responsibleName', label: 'Responsible Name' },// <-- added required
        { key: 'responsiblePhone', label: 'Responsible Phone' } // <-- added required
    ];
    
    // Change: safely read values from formData using typed keys and detect missingness
    const missingFields = requiredFields.filter(f => {
        const val = formData[f.key];
        if (typeof val === 'string') return !val.trim();
        return val == null;
    });

    // Add separate date missing check (we require date picker at least)
    const incidentDateMissing = !incidentDateOnly; // require date; time optional (we'll default to 00:00 if missing)

    // Add a general invalid flag for use in the UI (replaces undefined isTitleInvalid)
    const isFormInvalid = missingFields.length > 0 || incidentDateMissing;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading || saving) return;
        setApiError(null);
    
        if (missingFields.length > 0 || incidentDateMissing) {
            const missingLabels = missingFields.map(f => f.label);
            if (incidentDateMissing) missingLabels.push('Incident Date');
            setApiError('กรุณากรอกข้อมูลให้ครบถ้วน: ' + missingLabels.join(', '));
            return;
        }
    
        // COMBINE pickers into ISO here (pickers are local-edit state)
        const datePart = incidentDateOnly ?? new Date();
        const timePart = incidentTimeOnly ?? new Date(1970, 0, 1, 0, 0, 0);
    
        const combinedLocal = new Date(
            datePart.getFullYear(),
            datePart.getMonth(),
            datePart.getDate(),
            timePart.getHours(),
            timePart.getMinutes(),
            timePart.getSeconds(),
            timePart.getMilliseconds()
        );
        const incidentIso = combinedLocal.toISOString();
    
        // เตรียม DTO (partial; server manages readonly/audit fields)
        const baseDto: Partial<IncidentReportDto> = {
            id: formData.id, // อาจ undefined สำหรับ create
            caseNo: formData.caseNo, // server อาจ generate ถ้าเว้นว่าง
            title: formData.title.trim(),        // <-- trim
            asset: formData.asset,
            center: formData.center,
            
            symptoms: formData.symptoms,
            severity: formData.severity
                ? parseInt(formData.severity, 10)
                : undefined, // หรือใส่ 0 ถ้า backend ต้องการค่าเสมอ: : 0
            impact: formData.impact,
            domain: formData.domain,
            subDomain: formData.subDomain,
            vendor: formData.vendor,
            manufacturer: formData.manufacturer,
            partNumber: formData.partNumber,
            additionalInfo: formData.additionalInfo,
            interimAction: formData.interimAction,
            intermediateAction: formData.intermediateAction,
            longTermAction: formData.longTermAction,
            status: formData.status,
            responsibleName: formData.responsibleName,
            responsibleLineId: formData.responsibleLineId,
            responsibleEmail: formData.responsibleEmail,
            responsiblePhone: formData.responsiblePhone,
            incidentDate: incidentIso // <-- COMBINED ISO at save time
        };
    
        // เก็บ payload ชั่วคราว แล้วเปิด ConfirmDialog แทน window.confirm
        setPendingDto(baseDto);
        setSubmitConfirmOpen(true);
    };

    // NEW: ฟังก์ชันเรียก API เมื่อผู้ใช้ยืนยันใน ConfirmDialog
    const submitConfirmed = async () => {
        setSubmitConfirmOpen(false);
        if (!pendingDto) return;
        setSaving(true);
        setApiError(null);
        try {
            let finalCaseNo = formData.caseNo;
            if (isEdit) {
                if (!formData.id) throw new Error('Missing id for update');
                await updateIncidentFull(pendingDto as Partial<IncidentReportDto> & { id: number });
                // For edit: do NOT redirect. Show success Snackbar
                setSnackMessage('Saved successfully');
                setSnackOpen(true);
            } else {
                const created = await apiCreateIncident(pendingDto as Partial<IncidentReportDto>);
                finalCaseNo = created.caseNo || finalCaseNo;
                navigate(`/issues/${finalCaseNo}`);
            }
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.message || 'Error occurred while saving';
            // Show AlertDialog on error instead of inline apiError
            setErrorDialogTitle('Error');
            setErrorDialogMessage(msg);
            setErrorDialogOpen(true);
        } finally {
            setSaving(false);
            setPendingDto(null);
        }
    };



 

    return (
        <>
            <Container maxWidth="md" disableGutters>
                <Paper
                    className="incident-form"
                    sx={{
                        p: { xs: 2, sm: 3 },
                        mt: 4,
                        maxWidth: 960,
                        width: '100%',
                        mx: { xs: 0, sm: 'auto' },
                        borderRadius: { xs: 0, sm: 2 },
                        boxShadow: { xs: 'none', sm: 3 }
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom>
                        Issue Report
                    </Typography>

                    {loading && (
                        <Typography sx={{ mb: 2 }} variant="body2" color="text.secondary">
                            Loading...
                        </Typography>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                        <Stack spacing={2}>

                            {/* Basic info */}
                            <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                ข้อมูลเคส (Case Information)
                                </Typography>
                                {isEdit && (
                                    <Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            margin="dense"
                                            id="caseNo"
                                            name="caseNo"
                                            label="Case No"
                                            value={formData.caseNo}
                                            disabled
                                            sx={getSxFor('caseNo' as keyof IFormData)}
                                            inputProps={{ className: getClassFor('caseNo' as keyof IFormData) }}
                                        />
                                    </Box>
                                )}
                                {!isEdit && (
                                    <input type="hidden" name="caseNo" value={formData.caseNo} />
                                )}
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="title"
                                        name="title"
                                        label="Title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        error={!formData.title.trim()}
                                        helperText={!formData.title.trim() ? 'Title is required' : ' '}
                                        sx={getSxFor('title')}
                                        inputProps={{ className: getClassFor('title') }}
                                    />
                                </Box>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="asset"
                                        name="asset"
                                        label="Asset (รถ)"
                                        value={formData.asset}
                                        onChange={handleChange}
                                        required
                                        error={!formData.asset.trim()}
                                        helperText={!formData.asset.trim() ? 'Asset is required' : ' '}
                                        sx={getSxFor('asset')}
                                        inputProps={{ className: getClassFor('asset') }}
                                    />
                                </Box>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="center"
                                        name="center"
                                        label="Center (ศูนย์)"
                                        value={formData.center}
                                        onChange={handleChange}
                                        required
                                        error={!formData.center.trim()}
                                        helperText={!formData.center.trim() ? 'Center is required' : ' '}
                                        sx={getSxFor('center')}
                                        inputProps={{ className: getClassFor('center') }}
                                    />
                                </Box>

                                <Box>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <DatePicker
                                                label="Incident Date (วันที่เกิดเหตุ)"
                                                value={incidentDateOnly}
                                                format="dd/MM/yyyy" // กำหนดรูปแบบวัน/เดือน/ปี
                                                slotProps={{
                                                    textField: {
                                                        
                                                        fullWidth: true,
                                                        size: 'small',
                                                        margin: 'dense',
                                                        id: 'incidentDate',
                                                        name: 'incidentDate',
                                                        required: true,
                                                        error: !incidentDateOnly,
                                                        helperText: !incidentDateOnly ? 'Incident Date is required' : ' ',
                                                        sx: getSxFor('incidentDate' as keyof IFormData),
                                                        inputProps: { className: getClassFor('incidentDate' as keyof IFormData) }
                                                    }
                                                }}
                                                onChange={(newDate) => {
                                                    setIncidentDateOnly(newDate);
                                                    // DO NOT write to formData.incidentDate here; combine only on submit
                                                }}
                                                
                                            />

                                            <TimePicker
                                                label="Time (เวลา)"
                                                value={incidentTimeOnly}
                                                onChange={(newTime) => {
                                                    setIncidentTimeOnly(newTime);
                                                    // DO NOT write to formData.incidentDate here; combine only on submit
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        size: 'small',
                                                        margin: 'dense',
                                                        sx: { width: 160 },
                                                        inputProps: { className: getClassFor('incidentDate' as keyof IFormData) }
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </LocalizationProvider>
                                </Box>
                            </Box>

                            {/* Incident details */}
                            <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                รายละเอียดเหตุการณ์ (Incident Details)
                                </Typography>
                                
                                <Box
                                    sx={{
                                        border: !formData.symptoms.trim() ? '2px solid #f44336' : '1px solid rgba(0,0,0,0.23)',
                                        borderRadius: 4,
                                        padding: '12px 14px',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                        Symptoms (อาการ)
                                    </Typography>
                                    <WysiwygMarkdownEditor
                                        value={formData.symptoms}
                                        onChange={(md) => setFormData(prev => ({ ...prev, symptoms: md }))}
                                        minHeight={140}
                                        placeholder="Symptoms"
                                    />
                                    {!formData.symptoms.trim() && (
                                        <Typography color="error" sx={{ color: '#f44336', fontSize: '0.75rem' }}>Symptoms are required</Typography>
                                    )}
                                </Box>
                                <Box>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="severity"
                                        name="severity"
                                        label="Severity (ระดับความรุนแรง)"
                                        value={formData.severity}
                                        onChange={handleChange}
                                        required
                                        error={!(formData.severity ?? '').toString().trim()}
                                        helperText={!formData.severity.trim() ? 'Severity is required' : 'เลือกระดับความรุนแรง 1 (ต่ำ) - 5 (สูงมาก)'}
                                        sx={getSxFor('severity' as keyof IFormData)}
                                        inputProps={{ className: getClassFor('severity' as keyof IFormData) }}
                                    >
                                        {severityOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="impact" name="impact" label="Incident Impact (ผลกระทบ)"  value={formData.impact} onChange={handleChange} 
                                    sx={getSxFor('impact')} inputProps={{ className: getClassFor('impact') }} />
                                </Box>
                            </Box>

                            {/* Responsible person */}
                            <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Responsible/Coordinator (ผู้ประสานงาน)
                                </Typography>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="responsibleName"
                                        name="responsibleName"
                                        label="Responsible Name"
                                        value={formData.responsibleName}
                                        onChange={handleChange}
                                        required
                                        error={!formData.responsibleName.trim()}
                                        helperText={!formData.responsibleName.trim() ? 'Responsible Name is required' : ' '}
                                        sx={getSxFor('responsibleName')}
                                        inputProps={{ className: getClassFor('responsibleName') }}
                                    />
                                 </Box>
                                 <Box>
                                     <TextField fullWidth size="small" margin="dense" id="responsibleLineId" name="responsibleLineId" label="Line ID" value={formData.responsibleLineId} onChange={handleChange}
                                     sx={getSxFor('responsibleLineId')} inputProps={{ className: getClassFor('responsibleLineId') }} />
                                 </Box>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="responsibleEmail"
                                        name="responsibleEmail"
                                        label="Email"
                                        type="email"
                                        value={formData.responsibleEmail}
                                        onChange={handleChange}
                                        sx={getSxFor('responsibleEmail')}
                                        inputProps={{ className: getClassFor('responsibleEmail') }}
                                    />
                                </Box>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="responsiblePhone"
                                        name="responsiblePhone"
                                        label="Contact Phone"
                                        value={formData.responsiblePhone}
                                        onChange={handleChange}
                                        required
                                        error={!formData.responsiblePhone.trim()}
                                        helperText={!formData.responsiblePhone.trim() ? 'Contact Phone is required' : ' '}
                                        sx={getSxFor('responsiblePhone')}
                                        inputProps={{ className: getClassFor('responsiblePhone') }}
                                    />
                                </Box>
                            </Box>

                            {/* Problem & Supplier details */}
                            <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Asset & Vendor (ข้อมูลสินทรัพย์และผู้จัดจำหน่าย)
                                </Typography>
                                <Box>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="domain"
                                        name="domain"
                                        label="Problem Domain"
                                        value={formData.domain}
                                        onChange={handleChange}
                                        required
                                        error={!formData.domain.trim()}
                                        helperText={!formData.domain.trim() ? 'Problem Domain is required' : ' '}
                                        sx={getSxFor('domain')}
                                        inputProps={{ className: getClassFor('domain') }}
                                    >
                                        {domainOptions.map(opt => (<MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>))}
                                    </TextField>
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="subDomain" name="subDomain" label="Problem Sub-domain" value={formData.subDomain} onChange={handleChange}
                                    sx={getSxFor('subDomain')} inputProps={{ className: getClassFor('subDomain') }} />
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="vendor" name="vendor" label="Vendor" value={formData.vendor} onChange={handleChange}
                                    sx={getSxFor('vendor')} inputProps={{ className: getClassFor('vendor') }} />
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="manufacturer" name="manufacturer" label="Manufacturer" value={formData.manufacturer} onChange={handleChange}
                                    sx={getSxFor('manufacturer')} inputProps={{ className: getClassFor('manufacturer') }} />
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="partNumber" name="partNumber" label="Part/Control Number" value={formData.partNumber} onChange={handleChange}
                                    sx={getSxFor('partNumber')} inputProps={{ className: getClassFor('partNumber') }} />
                                </Box>
                                <Box>
                                    <TextField fullWidth size="small" margin="dense" id="additionalInfo" name="additionalInfo" label="Additional Information" value={formData.additionalInfo} onChange={handleChange}
                                    sx={getSxFor('additionalInfo')} inputProps={{ className: getClassFor('additionalInfo') }} />
                                </Box>
                            </Box>

                            {/* Actions & Status */}
                            <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                    Actions & Status
                                </Typography>
                                <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Interim Action</Typography>
                                    <WysiwygMarkdownEditor
                                        value={formData.interimAction}
                                        onChange={(md) => setFormData(prev => ({ ...prev, interimAction: md }))}
                                        minHeight={140}
                                        placeholder="Interim Action"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Intermediate Action</Typography>
                                    <WysiwygMarkdownEditor
                                        value={formData.intermediateAction}
                                        onChange={(md) => setFormData(prev => ({ ...prev, intermediateAction: md }))}
                                        minHeight={140}
                                        placeholder="Intermediate Action"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Long-term Action</Typography>
                                    <WysiwygMarkdownEditor
                                        value={formData.longTermAction}
                                        onChange={(md) => setFormData(prev => ({ ...prev, longTermAction: md }))}
                                        minHeight={140}
                                        placeholder="Long-term Action"
                                    />
                                </Box>
                                {isEdit && (
                                    <Box>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            margin="dense"
                                            id="status"
                                            name="status"
                                            label="Incident Status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            sx={getSxFor('status')}
                                            inputProps={{ className: getClassFor('status') }}
                                        >
                                            {incidentStatusOptions.map(opt => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.icon && <span style={{ marginRight: 8 }}>{opt.icon}</span>}
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                )}
                            </Box>

                        </Stack>

                        {apiError && (
                            <Typography color="error" sx={{ mt: 2, fontSize: '.9rem', whiteSpace: 'pre-wrap' }}>
                                {apiError}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={saving || isFormInvalid || (isEdit && !isFormChanged)}
                            sx={{ mt: 3, mb: 2, py: 2, fontSize: '1.05rem' }}
                        >
                            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Submit')}
                        </Button>

                        {/* เพิ่มปุ่ม Close เฉพาะเมื่อมีการบันทึกแล้ว (formData.id มีค่า) */}
                        {formData.id && (
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    onClick={() => navigate('/issues')}
                                >
                                    Close to List
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    fullWidth
                                    onClick={() => navigate(`/issues/${formData.caseNo}`)}
                                >
                                    Close to Detail
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Paper>
            </Container>


            {/* Confirm Dialog for form submit (replaces window.confirm) */}
            <ConfirmDialog
                open={submitConfirmOpen}
                title={isEdit ? "Confirm Save" : "Confirm Create"}
                message={isEdit ? "Are you sure you want to save change?" : "Are you sure you want to submit this issue?"}
                onClose={() => { setSubmitConfirmOpen(false); setPendingDto(null); }}
                onConfirm={submitConfirmed}
            />

            {/* Snackbar for success (edit) */}
            <SnackbarAlert
                open={snackOpen}
                message={snackMessage}
                severity="success"
                onClose={() => setSnackOpen(false)}
            />

            {/* AlertDialog for errors */}
            <AlertDialog
                open={errorDialogOpen}
                title={errorDialogTitle}
                message={errorDialogMessage}
                onClose={() => setErrorDialogOpen(false)}
            />

            {/* Page loading overlay when any API call is running */}
            <PageLoading open={loading || saving} />
        </>
    );
};

export default IncidentReportForm;