/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, MenuItem, TextareaAutosize, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';
import './IncidentReportForm.css'; // เพิ่ม (ถ้ายังไม่ได้ import)
import { createIncident as apiCreateIncident, getIncidentByCase, updateIncidentFull, getCurrentUser } from '../api/client'; // เพิ่ม import
import type { IncidentReportDto } from '../api/client';
import { domainOptions, severityOptions } from '../constants/incidentOptions'; // <-- refactored import

interface IFormData {
    id?: number;                 // <-- เพิ่ม id
    case_no: string;
    title: string;               // NEW
    asset: string;
    center: string;
    incident_date: string;
    symptoms: string;
    severity: string;
    impact: string;
    domain: string; // จะเก็บ code เช่น '001'
    sub_domain: string;
    vendor: string;
    manufacturer: string;
    part_number: string;
    additional_info: string;
    interim_action: string;
    intermediate_action: string;
    long_term_action: string;
    status: string;
    created_by: string;
    // added responsible person fields
    responsible_name: string;
    responsible_lineid: string;
    responsible_email: string;
    responsible_phone: string;
}

const IncidentReportForm: React.FC = () => {
    const { case_no: caseNoFromUrl } = useParams<{ case_no: string }>();
    const navigate = useNavigate();
    const isEdit = !!caseNoFromUrl;

    const today = new Date();
    const isoToday = today.toISOString().split('T')[0];

    const [formData, setFormData] = useState<IFormData>({
        id: undefined,
        case_no: '',
        title: '',            // NEW
        asset: '',
        center: '',
        incident_date: isoToday,           // default today
        symptoms: '',
        severity: '',
        impact: '',
        domain: '',
        sub_domain: '',
        vendor: '',
        manufacturer: '',
        part_number: '',
        additional_info: '',
        interim_action: '',
        intermediate_action: '',
        long_term_action: '',
        status: '',
        created_by: '',
        // initialize new fields
        responsible_name: '',
        responsible_lineid: '',
        responsible_email: '',
        responsible_phone: ''
    });

    useEffect(() => {
        // ดึงข้อมูล user มาเติม default
        getCurrentUser()
            .then(user => {
                if (user?.email) {
                    setFormData(f => ({
                        ...f,
                        created_by: user.email // หรือใช้ชื่อ field ที่ต้องการ เช่น user.firstName
                    }));
                }
            })
            .catch(() => { /* ไม่ต้องเติมอะไรถ้า error */ });
    }, []);
    
    // Date object for the date picker (default today)
    const [incidentDate, setIncidentDate] = useState<Date | null>(today);

    // NEW: api states
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);   // <-- เพิ่ม

    useEffect(() => {
        let ignore = false;
        const load = async () => {
            if (!caseNoFromUrl) {
                // NEW (create mode) – ใส่ค่า default เฉพาะ create
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
                setFormData({
                    id: dto.id,
                    case_no: dto.case_no || caseNoFromUrl,
                    title: dto.title || dto.case_no || 'Untitled',      // <-- fallback
                    asset: dto.asset || '',
                    center: dto.center || '',
                    incident_date: dto.incident_date || isoToday,
                    symptoms: dto.symptoms || '',
                    severity: String(dto.severity ?? ''),
                    impact: dto.impact || '',
                    domain: dto.domain || '',
                    sub_domain: dto.sub_domain || '',
                    vendor: dto.vendor || '',
                    manufacturer: dto.manufacturer || '',
                    part_number: dto.part_number || '',
                    additional_info: dto.additional_info || '',
                    interim_action: dto.interim_action || '',
                    intermediate_action: dto.intermediate_action || '',
                    long_term_action: dto.long_term_action || '',
                    status: dto.status || '',
                    created_by: dto.created_by || '',
                    responsible_name: dto.responsible_name || '',
                    responsible_lineid: dto.responsible_lineid || '',
                    responsible_email: dto.responsible_email || '',
                    responsible_phone: dto.responsible_phone || ''
                });
            } catch (e: any) {
                if (!ignore) setApiError(e?.response?.data?.message || e?.message || 'Load failed');
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        load();
        return () => { ignore = true; };
    }, [caseNoFromUrl, isoToday]);

    useEffect(() => {
        if (!isEdit) { // เฉพาะ create เท่านั้น
            getCurrentUser()
                .then(user => {
                    if (user?.email) {
                        setFormData(f => ({
                            ...f,
                            created_by: user.email,
                            responsible_email: user.email // เติม responsible_email ด้วย email ของ user
                        }));
                    }
                    //responsible_name
                    if (user?.firstName || user?.lastName) {
                        setFormData(f => ({
                            ...f,
                            responsible_name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        }));
                    }
                    
                    
                })
                .catch(() => { /* ไม่ต้องเติมอะไรถ้า error */ });
        }
    }, [isEdit]);


    // keep incidentDate in sync with formData.incident_date when it's a parseable date (ISO or yyyy-mm-dd)
    useEffect(() => {
        if (!formData.incident_date) {
            setIncidentDate(null);
            return;
        }
        const d = new Date(formData.incident_date);
        if (!isNaN(d.getTime())) setIncidentDate(d);
        else setIncidentDate(null);
    }, [formData.incident_date]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Change: type keys as keyof IFormData so TS knows valid property names
    const requiredFields: Array<{ key: keyof IFormData; label: string }> = [
        { key: 'title', label: 'Title' },
        { key: 'asset', label: 'Asset' },
        { key: 'center', label: 'Center' },
        { key: 'incident_date', label: 'Incident Date' },
        { key: 'symptoms', label: 'Symptoms' },
        { key: 'severity', label: 'Severity' }
    ];
    
    // Change: safely read values from formData using typed keys and detect missingness
    const missingFields = requiredFields.filter(f => {
        const val = formData[f.key];
        if (typeof val === 'string') return !val.trim();
        return val == null;
    });

    // Add a general invalid flag for use in the UI (replaces undefined isTitleInvalid)
    const isFormInvalid = missingFields.length > 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading || saving) return;
        setApiError(null);
    
        if (missingFields.length > 0) {
            setApiError('กรุณากรอกข้อมูลให้ครบถ้วน: ' + missingFields.map(f => f.label).join(', '));
            return;
        }
    
        const confirmed = window.confirm(isEdit ? 'ยืนยันการบันทึกการแก้ไข?' : 'ยืนยันการสร้างรายการ?');
        if (!confirmed) return;
    
        // เตรียม DTO
        const baseDto: IncidentReportDto = {
            id: formData.id, // อาจ undefined สำหรับ create
            case_no: formData.case_no, // server อาจ generate ถ้าเว้นว่าง
            title: formData.title.trim(),        // <-- trim
            asset: formData.asset,
            center: formData.center,
            incidentDate: formData.incident_date, // Map incident_date to occurredAt
            symptoms: formData.symptoms,
            severity: formData.severity
                ? parseInt(formData.severity, 10)
                : undefined, // หรือใส่ 0 ถ้า backend ต้องการค่าเสมอ: : 0
            impact: formData.impact,
            domain: formData.domain,
            sub_domain: formData.sub_domain,
            vendor: formData.vendor,
            manufacturer: formData.manufacturer,
            part_number: formData.part_number,
            additional_info: formData.additional_info,
            interim_action: formData.interim_action,
            intermediate_action: formData.intermediate_action,
            long_term_action: formData.long_term_action,
            status: formData.status,
            created_by: formData.created_by,
            responsible_name: formData.responsible_name,
            responsible_lineid: formData.responsible_lineid,
            responsible_email: formData.responsible_email,
            responsible_phone: formData.responsible_phone
        };
    
        try {
            setSaving(true);
            let finalCaseNo = formData.case_no;
            if (isEdit) {
                if (!formData.id) throw new Error('Missing id for update');
                await updateIncidentFull(baseDto);
            } else {
                const created = await apiCreateIncident(baseDto);
                finalCaseNo = created.case_no || finalCaseNo;
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
                                        id="case_no"
                                        name="case_no"
                                        label="Case No"
                                        value={formData.case_no}
                                        disabled
                                        sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
                                    />
                                </Box>
                            )}
                            {!isEdit && (
                                <input type="hidden" name="case_no" value={formData.case_no} />
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
                                    sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
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
                                    sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
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
                                    sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
                                />
                            </Box>

                            <Box>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Incident Date (วันที่เกิดเหตุ)"
                                        value={incidentDate}
                                        format="dd MMM yyyy"
                                        onChange={(newValue) => {
                                            setIncidentDate(newValue);
                                            setFormData(prev => ({
                                                ...prev,
                                                incident_date: newValue ? formatDate(newValue, 'yyyy-MM-dd') : ''
                                            }));
                                        }}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small',
                                                margin: 'dense',
                                                id: 'incident_date',
                                                name: 'incident_date',
                                                required: true,
                                                error: !formData.incident_date.trim(),
                                                helperText: !formData.incident_date.trim() ? 'ต้องกรอก Incident Date' : ' ',
                                                sx: { '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }
                                            }
                                        }}
                                    />
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
                                    error={!formData.severity.trim()}
                                    helperText={!formData.severity.trim() ? 'ต้องกรอก Severity' : 'เลือกระดับความรุนแรง 1 (ต่ำ) - 5 (สูงมาก)'}
                                    sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
                                >
                                    {severityOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="impact" name="impact" label="Incident Impact (ผลกระทบ)"  value={formData.impact} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                        </Box>

                        {/* Responsible person */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Responsible Person
                            </Typography>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsible_name" name="responsible_name" label="Responsible Name" value={formData.responsible_name} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsible_lineid" name="responsible_lineid" label="Line ID" value={formData.responsible_lineid} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsible_email" name="responsible_email" label="Email" type="email" value={formData.responsible_email} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="responsible_phone" name="responsible_phone" label="Contact Phone" value={formData.responsible_phone} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                        </Box>

                        {/* Problem & Supplier details */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Problem / Supplier
                            </Typography>
                            <Box>
                                <TextField select fullWidth size="small" margin="dense" id="domain" name="domain" label="Problem Domain" value={formData.domain} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}>
                                    {domainOptions.map(opt => (<MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>))}
                                </TextField>
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="sub_domain" name="sub_domain" label="Problem Sub-domain" value={formData.sub_domain} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="vendor" name="vendor" label="Vendor" value={formData.vendor} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="manufacturer" name="manufacturer" label="Manufacturer" value={formData.manufacturer} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="part_number" name="part_number" label="Part/Control Number" value={formData.part_number} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="additional_info" name="additional_info" label="Additional Information" value={formData.additional_info} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                        </Box>

                        {/* Actions & Status */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Actions & Status
                            </Typography>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Interim Action</Typography>
                                <TextareaAutosize id="interim_action" name="interim_action" value={formData.interim_action} onChange={handleChange} minRows={4} placeholder="Interim Action" style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Intermediate Action</Typography>
                                <TextareaAutosize id="intermediate_action" name="intermediate_action" value={formData.intermediate_action} onChange={handleChange} minRows={4} placeholder="Intermediate Action" style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Long-term Action</Typography>
                                <TextareaAutosize id="long_term_action" name="long_term_action" value={formData.long_term_action} onChange={handleChange} minRows={4} placeholder="Long-term Action" style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            {isEdit && (
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        id="status"
                                        name="status"
                                        label="Incident Status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        slotProps={{ input: { readOnly: true } }}
                                        sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }}
                                    />
                                </Box>
                            )}
                            <Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    id="created_by"
                                    name="created_by"
                                    label="Created by"
                                    value={formData.created_by}
                                    onChange={handleChange}
                                    InputProps={{
                                        readOnly: true,
                                        sx: { backgroundColor: '#f5f5f5' } // สีเทาอ่อน
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 },
                                        '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' } // สีเทาอ่อน
                                    }}
                                />
                            </Box>
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