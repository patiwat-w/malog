import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../../types/user';
import { getUserById, updateUser } from '../../api/users';
import { Button, TextField, FormControlLabel, Checkbox, Typography } from '@mui/material';

const UserEditForm: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const fetchedUser = await getUserById(Number(userId));
                setUser(fetchedUser);
            } catch (err) {
                setError('Failed to fetch user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user) {
            setUser({ ...user, [event.target.name]: event.target.value });
        }
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user) {
            setUser({ ...user, [event.target.name]: event.target.checked });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (user) {
            try {
                await updateUser(user);
                navigate('/admin'); // Redirect to admin page after successful update
            } catch (err) {
                setError('Failed to update user data');
            }
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <form onSubmit={handleSubmit}>
            <TextField
                label="First Name"
                name="firstName"
                value={user?.firstName || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Last Name"
                name="lastName"
                value={user?.lastName || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Email"
                name="email"
                value={user?.email || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                type="email"
            />
            <TextField
                label="Phone Number"
                name="phoneNumber"
                value={user?.phoneNumber || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Organization Info"
                name="organizationInfo"
                value={user?.organizationInfo || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={user?.receiveNotifications || false}
                        onChange={handleCheckboxChange}
                        name="receiveNotifications"
                    />
                }
                label="Receive Notifications"
            />
            <Button type="submit" variant="contained" color="primary">
                Save Changes
            </Button>
        </form>
    );
};

export default UserEditForm;