import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/client';

function LogoutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const success = await logout();
                if (success) {
                    navigate('/login'); // Redirect to login page
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        })();
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        }}>
            Signing out...
        </div>
    );
}

export default LogoutPage;