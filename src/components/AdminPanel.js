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
    CssBaseline,
    Input,
} from '@mui/material';

export default function AdminPanel() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);
    const [file, setFile] = React.useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleFileUpload = () => {
        if (file) {
            // Здесь будет логика загрузки файла на сервер
            console.log('Uploading file:', file.name);
        }
    };

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
                <Container maxWidth="lg">
                    <Typography variant="h4" gutterBottom>
                        Панель администратора
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Загрузка файла
                                </Typography>
                                <Input
                                    type="file"
                                    onChange={handleFileChange}
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleFileUpload}
                                    disabled={!file}
                                >
                                    Загрузить файл
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
}