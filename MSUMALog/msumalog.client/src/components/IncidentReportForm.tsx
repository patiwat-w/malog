/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, MenuItem, TextareaAutosize, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './IncidentReportForm.css'; // เพิ่ม (ถ้ายังไม่ได้ import)
import { createIncident as apiCreateIncident, getIncidentByCase, updateIncidentFull, getCurrentUser } from '../api/client'; // เพิ่ม import
import type { IncidentReportDto } from '../api/client';
import { domainOptions, severityOptions, incidentStatusOptions } from '../constants/incidentOptions'; // <-- refactored import

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
        { key: 'severity', label: 'Severity' }
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
    
        const confirmed = window.confirm(isEdit ? 'ยืนยันการบันทึกการแก้ไข?' : 'ยืนยันการสร้างรายการ?');
        if (!confirmed) return;
    
        // COMBINE pickers into ISO here (pickers are local-edit state)
        const datePart = incidentDateOnly ?? new Date();
        const timePart = incidentTimeOnly ?? new Date(1970, 0, 1, 0, 0, 0);
    
        // Create a local Date using the selected local hours/minutes.
        // This preserves the exact local time the user picked (no unexpected timezone shift).
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
    
        try {
            setSaving(true);
            let finalCaseNo = formData.caseNo;
            if (isEdit) {
                if (!formData.id) throw new Error('Missing id for update');
                // update expects dto including id
                await updateIncidentFull(baseDto as Partial<IncidentReportDto> & { id: number });
            } else {
                const created = await apiCreateIncident(baseDto as Partial<IncidentReportDto>);
                finalCaseNo = created.caseNo || finalCaseNo;
            }
            navigate(`/issues/${finalCaseNo}`);
        } catch (err: any) {
            console.error(err);
            setApiError(err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    return (
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
                                    helperText={!formData.title.trim() ? 'ต้องกรอก Title' : ' '}
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
                                    helperText={!formData.asset.trim() ? 'ต้องกรอก Asset' : ' '}
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
                                    helperText={!formData.center.trim() ? 'ต้องกรอก Center' : ' '}
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
                                                    helperText: !incidentDateOnly ? 'ต้องกรอก Incident Date' : ' ',
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
                            
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                    Symptoms (อาการ)
                                </Typography>
                                <TextareaAutosize
                                    id="symptoms"
                                    name="symptoms"
                                    value={formData.symptoms}
                                    onChange={handleChange}
                                    minRows={3}
                                    required
                                    className={getClassFor('symptoms')}
                                    style={{
                                        width: '100%',
                                        fontSize: '1rem',
                                        padding: '8px 12px',
                                        boxSizing: 'border-box',
                                        borderRadius: 4,
                                        borderColor: '#c4c4c4',
                                        border: !formData.symptoms.trim() ? '1px solid red' : undefined
                                    }}
                                    placeholder="Symptoms"
                                />
                                {!formData.symptoms.trim() && (
                                    <Typography color="error" variant="caption">ต้องกรอก Symptoms</Typography>
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
                                    helperText={!formData.severity.trim() ? 'ต้องกรอก Severity' : 'เลือกระดับความรุนแรง 1 (ต่ำ) - 5 (สูงมาก)'}
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
                                Responsible Person
                            </Typography>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsibleName" name="responsibleName" label="Responsible Name" value={formData.responsibleName} onChange={handleChange}
                                sx={getSxFor('responsibleName')} inputProps={{ className: getClassFor('responsibleName') }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsibleLineId" name="responsibleLineId" label="Line ID" value={formData.responsibleLineId} onChange={handleChange}
                                sx={getSxFor('responsibleLineId')} inputProps={{ className: getClassFor('responsibleLineId') }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsibleEmail" name="responsibleEmail" label="Email" type="email" value={formData.responsibleEmail} onChange={handleChange}
                                sx={getSxFor('responsibleEmail')} inputProps={{ className: getClassFor('responsibleEmail') }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsiblePhone" name="responsiblePhone" label="Contact Phone" value={formData.responsiblePhone} onChange={handleChange}
                                sx={getSxFor('responsiblePhone')} inputProps={{ className: getClassFor('responsiblePhone') }} />
                            </Box>
                        </Box>

                        {/* Problem & Supplier details */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Problem / Supplier
                            </Typography>
                            <Box>
                                <TextField select fullWidth size="small" margin="dense" id="domain" name="domain" label="Problem Domain" value={formData.domain} onChange={handleChange}
                                sx={getSxFor('domain')} inputProps={{ className: getClassFor('domain') }}>
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
                                <TextareaAutosize id="interimAction" name="interimAction" value={formData.interimAction} onChange={handleChange} minRows={4} placeholder="Interim Action" 
                                className={getClassFor('interimAction')}
                                style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Intermediate Action</Typography>
                                <TextareaAutosize id="intermediateAction" name="intermediateAction" value={formData.intermediateAction} onChange={handleChange} minRows={4} placeholder="Intermediate Action" 
                                className={getClassFor('intermediateAction')}
                                style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Long-term Action</Typography>
                                <TextareaAutosize id="longTermAction" name="longTermAction" value={formData.longTermAction} onChange={handleChange} minRows={4} placeholder="Long-term Action" 
                                className={getClassFor('longTermAction')}
                                style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            {isEdit && (
                                <Box>
                                    {(() => {
                                        const statusOption = incidentStatusOptions.find(opt => opt.value === formData.status);
                                        return (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                margin="dense"
                                                id="status"
                                                name="status"
                                                label="Incident Status"
                                                value={statusOption?.label || formData.status}
                                                InputProps={{
                                                    readOnly: true,
                                                    startAdornment: statusOption?.icon ? (
                                                        <Box sx={{ mr: 1 }}>
                                                            <span>
                                                                {statusOption.icon}
                                                            </span>
                                                        </Box>
                                                    ) : undefined,
                                                    sx: { backgroundColor: '#f5f5f5' }
                                                }}
                                                sx={{
                                                    ...getSxFor('status'),
                                                    '& .MuiInputBase-root': {
                                                      backgroundColor: '#f5f5f5',
                                                      color: theme => {
                                                        const colorKey = statusOption?.color;
                                                        if (colorKey && colorKey !== 'default' && theme.palette[colorKey]) {
                                                          return theme.palette[colorKey].main;
                                                        }
                                                        // ถ้าไม่มีสี ให้ไม่กำหนดสี (ใช้ค่า default ของ MUI)
                                                        return undefined;
                                                      }
                                                    }
                                                  }}
                                            />
                                        );
                                    })()}
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
                        disabled={saving || isFormInvalid}
                        sx={{ mt: 3, mb: 2, py: 2, fontSize: '1.05rem' }}
                    >
                        {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Submit')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default IncidentReportForm;