import { Box, Typography, Avatar, Paper, TextField, Button, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { getCurrentUser, setPassword } from '../api/client';

export default function UserProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [password, setPasswordInput] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!password || password.length < 8) {
            setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            return;
        }
        if (password !== confirm) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }
        setLoading(true);
        try {
            await setPassword(password);
            setSuccess(true);
            setPasswordInput('');
            setConfirm('');
        } catch (err) {
            setError('เปลี่ยนรหัสผ่านไม่สำเร็จ');
        }
        setLoading(false);
    };

    if (!user) {
        return (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Typography variant="h6" color="error">ไม่พบข้อมูลผู้ใช้</Typography>
            </Box>
        );
    }

    return (
        <Paper sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar src={user.profilePicture} sx={{ width: 80, height: 80 }} />
                <Typography variant="h5">{user.firstName} {user.lastName}</Typography>
                <Typography variant="body1" color="text.secondary">{user.email}</Typography>
                <Typography variant="body2" color="text.secondary">Role: {user.role}</Typography>
            </Box>
            <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1">เปลี่ยนรหัสผ่าน</Typography>
                <TextField
                    label="รหัสผ่านใหม่"
                    type="password"
                    value={password}
                    onChange={e => setPasswordInput(e.target.value)}
                    required
                    fullWidth
                    size="small"
                />
                <TextField
                    label="ยืนยันรหัสผ่าน"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    fullWidth
                    size="small"
                />
                <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                </Button>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">เปลี่ยนรหัสผ่านสำเร็จ</Alert>}
            </Box>
        </Paper>
    );
}