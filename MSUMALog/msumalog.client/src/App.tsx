import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';

import AppBreadcrumbs from './components/AppBreadcrumbs';
import RequireAuth from './components/RequireAuth';


import type { User } from './api/client';
import { getCurrentUser } from './api/client';
import LineBrowserGuard from "./components/LineBrowserGuard";
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import IncidentReportDetail from './pages/IncidentReportDetail';
import IncidentReportForm from './pages/IncidentReportForm';
import LoginFailPage from './pages/LoginFailPage';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import NotFoundPage from './pages/NotFoundPage';
import UserAccountPage from './pages/UserAccountPage';
import UserProfilePage from './pages/UserProfilePage';


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
        { label: 'New Issue', to: '/report' },
       // { label: 'Users', to: '/admin/users' },
        //{ label: 'Profile', to: '/profile' },
        // แสดงเมนู Admin เฉพาะผู้ใช้ที่เป็น Admin
        ...(currentUser?.role === 'Admin' ? [{ label: 'Admin', to: '/admin' }] : []),
        // แสดงเมนู User List เฉพาะผู้ใช้ที่เป็น Admin
        //...(currentUser?.role === 'Admin' ? [{ label: 'User List', to: '/admin/users' }] : [])

    ];

    return (
        <>
            <LineBrowserGuard />
            {showNav && (
                <>
                    <AppBar 
                        position="sticky" 
                        elevation={3}
                        sx={{ m: 0, p: 0, left: 0, right: 0, top: 0, width: '100%' }}
                    >
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
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        maxWidth: 150, // Limit the width of the button
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis', // Add ellipsis for overflow
                                    }}
                                >
                                    {`${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`}
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
                        <ListItemButton
                            component={Link}
                            to="/logout"
                            onClick={() => setMobileOpen(false)}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center', // Center the icon
                            }}
                        >
                            <IconButton color="inherit">
                                <AccountCircleIcon />
                            </IconButton>
                        </ListItemButton>
                    </Drawer>
                </>
            )}

            <Container maxWidth={false} className="msu-container" sx={{ py: showNav ? 2 : 0 }}>
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
                        <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
                        <Route path="/admin/:case_no" element={<RequireAuth><IncidentReportForm /></RequireAuth>} />
                        <Route path="/admin/users" element={<RequireAuth><UserAccountPage /></RequireAuth>} />

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Container>
        </>
    );
}

export default App;