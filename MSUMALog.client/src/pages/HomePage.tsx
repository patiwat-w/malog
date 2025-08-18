import React, { useState } from 'react';
import { Container, Box, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Link } from 'react-router-dom';
import FilterListIcon from '@mui/icons-material/FilterList';

const IncidentList = () => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);

    const incidentStatusOptions = [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' }
    ];

    const severityOptions = [
        { value: 'low', labelInEn: 'Low' },
        { value: 'medium', labelInEn: 'Medium' },
        { value: 'high', labelInEn: 'High' }
    ];

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
                    {/* Filter สำหรับหน้าจอใหญ่ */}
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            gap: 2,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            flex: 1,
                            minWidth: 0
                        }}
                    >
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
                                <MenuItem key={opt.value} value={opt.value}>{opt.labelInEn}</MenuItem>
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
                    {/* ปุ่ม More Filter สำหรับหน้าจอเล็ก ใช้ไอคอน */}
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, flex: 1 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            onClick={() => setFilterOpen(true)}
                            startIcon={<FilterListIcon />}
                        >
                            {/* ไม่ต้องใส่ข้อความ */}
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
                {/* Dialog สำหรับ Filter บนหน้าจอเล็ก */}
                <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Filter Issues</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="Search Title"
                                size="small"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ width: '100%' }}
                            />
                            <TextField
                                select
                                label="Status"
                                size="small"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                sx={{ width: '100%' }}
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
                                sx={{ width: '100%' }}
                            >
                                <MenuItem value="">All Severity</MenuItem>
                                {severityOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.labelInEn}</MenuItem>
                                ))}
                            </TextField>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                    setSearch('');
                                    setFilterStatus('');
                                    setFilterSeverity('');
                                }}
                            >
                                Clear Filter
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setFilterOpen(false)}
                            >
                                Apply
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
        </Container>
    );
};

export default IncidentList;
