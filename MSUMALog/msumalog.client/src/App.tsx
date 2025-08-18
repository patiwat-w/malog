import './App.css';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import RequireAuth from './components/RequireAuth';
import AppBreadcrumbs from './components/AppBreadcrumbs';


import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import IncidentReportForm from './pages/IncidentReportForm';
import IncidentReportDetail from './pages/IncidentReportDetail';
import LogoutPage from './pages/LogoutPage';
import LoginFailPage from './pages/LoginFailPage';
import NotFoundPage from './pages/NotFoundPage';
import { getCurrentUser } from './api/client';
import UserProfilePage from './pages/UserProfilePage';
import type { User } from './api/client';
import LineBrowserGuard from "./components/LineBrowserGuard";

function App() {
    const location = useLocation();
    const showNav = location.pathname !== '/login';
    const [mobileOpen, setMobileOpen] = useState(false);
    // broadened type to accept the full user object returned by getCurrentUser
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        getCurrentUser()
            .then(user => setCurrentUser(user))
            .catch(() => setCurrentUser(null));
    }, []);

    const navItems = [
        { label: 'Home', to: '/home' },
        { label: 'Report Issue', to: '/report' },
        { label: 'All Issues', to: '/issues' }
    ];

    return (
        <>
            <LineBrowserGuard />
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
                            <Box sx={{ flexGrow: 1 }} />
                            {currentUser && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/profile"
                                    startIcon={<AccountCircleIcon />}
                                    sx={{ textTransform: 'none', fontWeight: 500 }}
                                >
                                    {currentUser?.firstName ?? ''} {currentUser?.lastName ?? ''}
                                </Button>
                            )}
                            <Button color="inherit" component={Link} to="/logout">Logout</Button>
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
                        <ListItemButton component={Link} to="/logout" onClick={() => setMobileOpen(false)}>
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
                        <Route path="/issues" element={<RequireAuth><HomePage /></RequireAuth>} />
                        <Route path="/issues" element={<RequireAuth><HomePage /></RequireAuth>} />
                        <Route path="/issues/new" element={<RequireAuth><IncidentReportForm /></RequireAuth>} />
                        <Route path="/issues/:case_no/edit" element={<RequireAuth><IncidentReportForm /></RequireAuth>} />
                        <Route path="/issues/:case_no" element={<RequireAuth><IncidentReportDetail /></RequireAuth>} />
                        <Route path="/report" element={<RequireAuth><IncidentReportForm /></RequireAuth>} />
                        <Route path="/logout" element={<LogoutPage />} />
                        <Route path="/home" element={<Navigate to="/issues" />} />
                        <Route path="/" element={<Navigate to="/issues" />} />
                        <Route path="/login-fail" element={<LoginFailPage />} />
                        <Route path="/profile" element={<RequireAuth><UserProfilePage /></RequireAuth>} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Container>
        </>
    );
}

export default App;