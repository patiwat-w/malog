import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function LogoutPage() {
    const navigate = useNavigate();
    useEffect(() => {
        (async () => {
           
            navigate('/login'); // adjust route name if different
        })();
    }, [navigate]);

    return <div style={{
        display:'flex',alignItems:'center',justifyContent:'center',
        minHeight:'100vh',fontFamily:'sans-serif'
    }}>Signing out...</div>;
}
export default LogoutPage;