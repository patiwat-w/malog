import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h4" color="error" gutterBottom>
                404 - ไม่พบหน้าที่คุณต้องการ
            </Typography>
            <Typography variant="body1" gutterBottom>
                กรุณาตรวจสอบ URL หรือกลับไปหน้าแรก
            </Typography>
            <Button variant="contained" color="primary" component={Link} to="/home">
                กลับหน้าแรก
            </Button>
        </Box>
    );
}