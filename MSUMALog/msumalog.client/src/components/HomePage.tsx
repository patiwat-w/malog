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
    Chip
} from '@mui/material';

interface IIssue {
    case_no: string;
    asset: string;
    center: string;
    incident_date: string;
    symptoms: string;
    status: string;
}

const mockIssues: IIssue[] = [
    {
        case_no: '2025-08-0001',
        asset: 'รถ MSU-6',
        center: 'รพร.ปัว',
        incident_date: 'วันที่ 10/8/2568',
        symptoms: 'คลัชจม ไม่สามารถเปลี่ยนเกียร์ได้ รถขับไม่ได้',
        status: 'In Progress',
    },
    {
        case_no: '2025-08-0002',
        asset: 'เครื่องกระตุกหัวใจ',
        center: 'รพ.มหาสารคาม',
        incident_date: 'วันที่ 11/8/2568',
        symptoms: 'เปิดไม่ติด',
        status: 'Closed',
    }
];

function HomePage() {
    const [issues, setIssues] = useState<IIssue[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // In a real app, you would fetch this data from an API
        setIssues(mockIssues);
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
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {issues.map((issue, index) => (
                        <React.Fragment key={issue.case_no}>
                            <ListItem
                                disablePadding
                                secondaryAction={
                                    <Chip label={issue.status} color={issue.status === 'Closed' ? 'default' : 'warning'} />
                                }
                            >
                                <ListItemButton onClick={() => handleRowClick(issue.case_no)}>
                                    <ListItemText
                                        primary={`${issue.case_no}: ${issue.asset} (${issue.center})`}
                                        secondary={issue.symptoms}
                                    />
                                </ListItemButton>
                            </ListItem>
                            {index < issues.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            </Box>
        </Container>
    );
}

export default HomePage;
