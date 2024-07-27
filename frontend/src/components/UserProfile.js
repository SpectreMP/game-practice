/**
 * User profile component.
 */

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from '../getLPTheme';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Avatar,
    CssBaseline,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getAccessToken, removeTokens } from '../utils/auth';

export default function UserProfile() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);
    const [user, setUser] = React.useState(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/users/me', {
                    headers: {
                        'Authorization': `Bearer ${getAccessToken()}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    console.error('Failed to fetch user data');
                    navigate('/sign-in');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/sign-in');
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        removeTokens();
        navigate('/');
    };

    if (!user) {
        return null; // или можно показать загрузку
    }

    return (
        <ThemeProvider theme={LPtheme}>
            <CssBaseline />
            <Box
                sx={{
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    minHeight: '100vh',
                    py: { xs: 4, sm: 12 },
                }}
            >
                <Container maxWidth="md">
                    <Paper 
                        elevation={3}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h4" gutterBottom>
                            Профиль пользователя
                        </Typography>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 80, height: 80 }}>
                            {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h5" gutterBottom>
                            {user.username}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            Email: {user.email}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            Роль: {user.role}
                        </Typography>
                        <Button
                            startIcon={<LockOutlinedIcon />}
                            variant="outlined"
                            sx={{ mt: 2, mb: 2 }}
                        >
                            Изменить пароль
                        </Button>
                        {user.role === 'admin' && (
                            <Button
                                component={RouterLink}
                                to="/admin"
                                startIcon={<AdminPanelSettingsIcon />}
                                variant="contained"
                                color="primary"
                                sx={{ mb: 2 }}
                            >
                                Панель администратора
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleLogout}
                        >
                            Выйти
                        </Button>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
}