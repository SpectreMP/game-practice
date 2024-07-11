import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from '../getLPTheme';
import { setTokens } from '../utils/auth';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" mt={1}>
      {'Copyright © '}  
      <Link color="inherit" href="https://mui.com/">МегаГеймдев&nbsp;</Link>
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function SignIn() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        try {
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': data.get('email'),
                    'password': data.get('password'),
                }),
            });
            if (response.ok) {
                const { access_token, refresh_token } = await response.json();
                setTokens(access_token, refresh_token);
                // Получаем данные пользователя
                await fetchUserData();
                // Перенаправляем на главную страницу или в профиль
                window.location.href = '/';
            } else {
                // Обработка ошибки авторизации
                console.error('Ошибка авторизации');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    };
    
    const fetchUserData = async () => {
        try {
            const response = await fetch('http://localhost:8000/users/me', {
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                },
            });
            if (response.ok) {
                const userData = await response.json();
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                console.error('Ошибка при получении данных пользователя');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    };

    return (
        <ThemeProvider theme={LPtheme}>
            <Box
                sx={{
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    minHeight: '100vh',
                    py: { xs: 4, sm: 12 },
                }}
            >
                <Container component="main" maxWidth="xs">
                    <CssBaseline />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography component="h1" variant="h4" gutterBottom>
                            Вход
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Электронная почта"
                                name="email"
                                autoComplete="email"
                                autoFocus
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Пароль"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                            />
                            <FormControlLabel
                                control={<Checkbox value="remember" color="primary" />}
                                label="Запомнить меня"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                Войти
                            </Button>
                            <Grid container>
                                <Grid item xs>
                                    <Link href="#" variant="body2">
                                        Забыли пароль?
                                    </Link>
                                </Grid>
                                <Grid item>
                                    <Link href="/sign-up" variant="body2">
                                        {"Нет аккаунта? Зарегистрироваться"}
                                    </Link>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                    <Copyright sx={{ mt: 8, mb: 4 }} />
                </Container>
            </Box>
        </ThemeProvider>
    );
}