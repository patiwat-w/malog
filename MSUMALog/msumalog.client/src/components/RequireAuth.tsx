import { useEffect, useState, type JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuth } from '../api/client'; // Import the checkAuth function

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const verifyAuth = async () => {
            const authenticated = await checkAuth(); // Call the checkAuth function
            setIsAuthenticated(authenticated);
        };
        verifyAuth();
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Show a loading state while checking authentication
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default RequireAuth;