import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Paper, MenuItem, TextareaAutosize, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';
import './IncidentReportForm.css'; // เพิ่ม (ถ้ายังไม่ได้ import)

interface IFormData {
    case_no: string;
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

const domainOptions: { code: string; label: string }[] = [
    { code: '001', label: 'ตัวรก' },
    { code: '002', label: 'ระบบไฟฟ้า' },
    { code: '003', label: 'ระบบสั่งการ' },
    { code: '004', label: 'CT Scanner' },
    { code: '005', label: 'เครื่องมือแพทย์' },
    { code: '006', label: 'Injector' },
    { code: '007', label: 'ระบบ Loady ผู้ป่วย' },
    { code: '999', label: 'อื่นๆ' }
];

const IncidentReportForm: React.FC = () => {
    const { case_no: caseNoFromUrl } = useParams<{ case_no: string }>();
    const navigate = useNavigate();

    const today = new Date();
    const isoToday = today.toISOString().split('T')[0];

    const [formData, setFormData] = useState<IFormData>({
        case_no: '',
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

    useEffect(() => {
        // Mock data fetching
        if (!caseNoFromUrl ) {
            setFormData({
                case_no: '2025-08-0001',
                asset: 'รถ MSU-6',
                center: 'รพร.ปัว',
                incident_date: '2025-08-10', // เปลี่ยนเป็น ISO yyyy-MM-dd เพื่อให้ parse ได้
                symptoms: 'คลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ รถขับไม่ได้',
                severity: 'สูงที่สุด (5)',
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
                status: 'In Progress',
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

    const generateCaseNo = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const seq = Math.floor(Math.random() * 9000 + 1000); // ตัวอย่าง mock
        return `${y}-${m}-${seq}`;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // ถ้าไม่มี case_no ให้ generate
        const finalCaseNo = formData.case_no?.trim() ? formData.case_no.trim() : generateCaseNo();

        const payload = { ...formData, case_no: finalCaseNo };

        try {
            // TODO: เรียก API จริง (POST /api/incidents)
            // const res = await createIncident(payload);
            console.log('Submitting Incident Payload:', payload);

            // หลังบันทึกสำเร็จ redirect ไปหน้ารายละเอียด
            navigate(`/issues/detail/${finalCaseNo}`);
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการบันทึก');
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
                            <Box>
                                <TextField fullWidth size="small" margin="dense" id="case_no" name="case_no" label="Case No" value={formData.case_no} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
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
                                <TextField fullWidth size="small" margin="dense" id="severity" name="severity" label="Severity" value={formData.severity} onChange={handleChange} sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.2 } }} />
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

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 2, fontSize: '1.05rem' }}>
                        Submit
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default IncidentReportForm;