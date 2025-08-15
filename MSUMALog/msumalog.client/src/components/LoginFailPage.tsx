import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function LoginFailPage() {
    return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h4" color="error" gutterBottom>
                Login Failed
            </Typography>
            <Typography variant="body1" gutterBottom>
                ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง
            </Typography>
            <Button variant="contained" color="primary" component={Link} to="/login">
                กลับไปหน้า Login
            </Button>
        </Box>
    );
}