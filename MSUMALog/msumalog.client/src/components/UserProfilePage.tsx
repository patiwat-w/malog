import { Box, Typography, Avatar, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../api/client';

export default function UserProfilePage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

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
                {/* เพิ่ม field อื่นๆ ตามต้องการ */}
            </Box>
        </Paper>
    );
}