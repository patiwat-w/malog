import './App.css';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import IncidentReportForm from './components/IncidentReportForm';
import AppBreadcrumbs from './components/AppBreadcrumbs';
import IncidentReportDetail from './components/IncidentReportDetail';

function App() {
    const location = useLocation();
    const showNav = location.pathname !== '/login';
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { label: 'Home', to: '/home' },
        { label: 'Report Issue', to: '/report' },
        { label: 'All Issues', to: '/issues' }
    ];

    return (
        <>
            {showNav && (
                <>
                    <AppBar position="sticky" elevation={3}>
                        <Toolbar variant="dense" sx={{ gap: 2 }}>
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                                onClick={() => setMobileOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                variant="h6"
                                component={Link}
                                to="/home"
                                sx={{
                                    flexGrow: 1,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                MSU MA Log
                            </Typography>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                                {navItems.map(i => (
                                    <Button key={i.to} color="inherit" component={Link} to={i.to}>
                                        {i.label}
                                    </Button>
                                ))}
                            </Box>
                            <Button color="inherit" component={Link} to="/login">Logout</Button>
                        </Toolbar>
                    </AppBar>

                    <Drawer
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        PaperProps={{ sx: { width: 260 } }}
                    >
                        <Box sx={{ p: 2, fontWeight: 600 }}>MSU MA Log</Box>
                        <Divider />
                        <List>
                            {navItems.map(i => (
                                <ListItemButton
                                    key={i.to}
                                    component={Link}
                                    to={i.to}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <ListItemText primary={i.label} />
                                </ListItemButton>
                            ))}
                        </List>
                        <Divider />
                        <ListItemButton component={Link} to="/login" onClick={() => setMobileOpen(false)}>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </Drawer>
                </>
            )}

            <Container maxWidth="xl" sx={{ py: showNav ? 2 : 0 }}>
                {showNav && <AppBreadcrumbs />}
                <Box>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/issues" element={<HomePage />} />

                        <Route path="/issues/new" element={<IncidentReportForm />} />
                        <Route path="/issues/:case_no/edit" element={<IncidentReportForm />} />
                        <Route path="/issues/:case_no" element={<IncidentReportDetail />} />
                        <Route path="/report" element={<IncidentReportForm />} />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </Box>
            </Container>
        </>
    );
}

export default App;