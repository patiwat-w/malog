/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, MenuItem, TextareaAutosize, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';
import './IncidentReportForm.css'; // เพิ่ม (ถ้ายังไม่ได้ import)
import { createIncident as apiCreateIncident } from '../api/client';
import type { IncidentReportDto } from '../api/client';
import { domainOptions, severityOptions } from '../constants/incidentOptions'; // <-- refactored import

interface IFormData {
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
    // Date object for the date picker (default today)
    const [incidentDate, setIncidentDate] = useState<Date | null>(today);

    // NEW: api states
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        // Mock data fetching
        if (!caseNoFromUrl ) {
            setFormData({
                case_no: '',
                title: 'ปัญหาคลัชจม รถ MSU-6', // NEW mock title
                asset: 'รถ MSU-6',
                center: 'รพร.ปัว',
                incident_date: '2025-08-10', // เปลี่ยนเป็น ISO yyyy-MM-dd เพื่อให้ parse ได้
                symptoms: 'คลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ รถขับไม่ได้',
                severity: '5', // ถ้าปรับเป็นตัวเลข 1-5 (แทน "สูงที่สุด (5)")
                impact: 'หยุดการให้บริการ',
                domain: '001', // ใช้ code แทนข้อความ
                sub_domain: 'ตัวรถและเครื่องยนต์',
                vendor: 'RMA',
                manufacturer: 'Mecedenz-Benz',
                part_number: 'OF-917 version Euro3',
                additional_info: 'N/A',
                interim_action: 'จากการตรวจสอบคาดว่าปั๊มน้ำมันคลัชตัวล่างน่าจะมีปัญหา น้ำมันแห้งจนลูกสูบปั๊มคลัชติด ทำให้แป้นคลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ โดยวันที่ 14/8/2568 ทาง พชร. จาก รพร.ปัว (พี่ดู่) ได้แก้ไขตามคำแนะนำของ EG โดยเดิมน้ำมันคลัช (DOT-4) และไล่ลมใหม่ เบื้องต้นล้มเหลว แต่ได้ดำเนินการใหม่โดยการอัดน้ำมันผ่านหลอดฉีดยาเข้าไปที่จุดไล่ลมปั๊มคลัชตัวล่าง จนลูกสูบหลุด และเริ่มดำเนินการจนคลัชกลับมาทำงานได้และขับได้ และนำรถกลับ รพร.ปัว',
                intermediate_action: 'ให้ รพร.ปัว ติดต่ออู่ซ่อมรถใหญ่ เพื่อทำการตรวจสอบระบบคลัช และปั๊มคลัชตัวล่าง ระบุจุดรั่วซึม และกำหนด part ที่มีปัญหา ทาง EG ดำเนินการขอใบเสนอราคาของตัวยปั๊มคลัชตัวล่าง SI พิจารณาเตรียมจัดซื้อ',
                long_term_action: 'จากคู่มือ น้ำมันคลัช ต้องมีการตรวจสอบระดับน้ำมัน และรอยรั่วซึมทุกๆ 6 เดือน และมีการเปลี่ยนถ่ายน้ำมันทุก 6 เดือน จึงควรบรรจุลงในแผนการซ่อมบำรุง แผนการ Training พชร. ใน MSU-SOS Standardization',
                status: 'Open',
                created_by: 'Pornchai Chanyagorn',
                // mock responsible person data
                responsible_name: 'Pornchai Chanyagorn',
                responsible_lineid: 'pornchai_line',
                responsible_email: 'pornchai@example.com',
                responsible_phone: '081-234-5678'
            });
        } else if (caseNoFromUrl) {
            // Handle case where case_no exists but no data is found, or fetch from API
            // For now, just log it and show an empty form with the case number.
            console.log(`No data for case_no: ${caseNoFromUrl}`);
            setFormData(prevState => ({ ...prevState, case_no: caseNoFromUrl }));
        }
    }, [caseNoFromUrl]);

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



    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiError(null);

        const confirmed = window.confirm('ยืนยันการบันทึกข้อมูล (Confirm save)?');
        if (!confirmed) return;

       
        const payload: IncidentReportDto = {
            // ถ้า schema มี id ให้เพิ่มเมื่อแก้ไข (ยังไม่มีในฟอร์มก็ไม่ใส่)
            case_no: "", // use generated or existing
            title: formData.title,          // NEW
            asset: formData.asset,
            center: formData.center,
            incident_date: formData.incident_date,
            symptoms: formData.symptoms,
            severity: formData.severity, // still string; parseInt(formData.severity,10) if backend expects number
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
            console.log('Submitting Incident Payload (swagger client):', payload);
            const created: IncidentReportDto = await apiCreateIncident(payload);
            navigate(`/issues/detail/${created.case_no }`);
        } catch (err: unknown) {
            console.error(err);
            setApiError((err as any)?.response?.data?.message || (err as any)?.message || 'เกิดข้อผิดพลาดในการบันทึก');
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

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                    <Stack spacing={2}>

                        {/* Basic info */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Basic Information
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
                                <TextField fullWidth size="small" margin="dense" id="title" name="title" label="Title" value={formData.title} onChange={handleChange} required sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="asset" name="asset" label="Asset" value={formData.asset} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="center" name="center" label="Center" value={formData.center} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                        </Box>

                        {/* Incident details */}
                        <Box component="fieldset" sx={{ borderColor: 'divider', p: 2, borderRadius: 1 }}>
                            <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                                Incident Details
                            </Typography>
                            <Box>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Incident Date"
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
                                                sx: { '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                    Symptoms
                                </Typography>
                                <TextareaAutosize id="symptoms" name="symptoms" value={formData.symptoms} onChange={handleChange} minRows={3} placeholder="Symptoms" style={{ width: '100%', fontSize: '1rem', padding: '8px 12px', boxSizing: 'border-box', borderRadius: 4, borderColor: '#c4c4c4' }} />
                            </Box>
                            <Box>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    id="severity"
                                    name="severity"
                                    label="Severity (1-5)"
                                    value={formData.severity}
                                    onChange={handleChange}
                                    helperText="เลือกระดับความรุนแรง 1 (ต่ำ) - 5 (สูงมาก)"
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
                                <TextField fullWidth size="small" margin="dense" id="impact" name="impact" label="Incident Impact" value={formData.impact} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
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
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="status" name="status" label="Incident Status" value={formData.status} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
                            </Box>
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="created_by" name="created_by" label="Created by" value={formData.created_by} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
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
                        disabled={saving}
                        sx={{ mt: 3, mb: 2, py: 2, fontSize: '1.05rem' }}
                    >
                        {saving ? 'Saving...' : 'Submit'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default IncidentReportForm;