import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from '../getLPTheme';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Button,
    Avatar,
    TextField,
    CssBaseline,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function UserProfile() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);

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
                            AV
                        </Avatar>
                        <Typography variant="h5" gutterBottom>
                            username
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            email: 
                        </Typography>
                        <Button
                            startIcon={<LockOutlinedIcon />}
                            variant="outlined"
                            sx={{ mt: 2, mb: 4 }}
                        >
                            Изменить пароль
                        </Button>
                        <Button
                            startIcon={<AdminPanelSettingsIcon />}
                            variant="contained"
                            color="primary"
                        >
                            Панель администратора
                        </Button>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
}