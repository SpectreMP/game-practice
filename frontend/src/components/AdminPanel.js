import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from '../getLPTheme';
import {
    Box,
    Container,
    Typography,
    Paper,
    CssBaseline,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    AppBar,
    Toolbar,
    IconButton,
    Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';
import config from '../../config';
import FileManagerWrapper from './FileManagerWrapper';

const drawerWidth = 240;

export default function AdminPanel() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [selectedTab, setSelectedTab] = React.useState('dashboard');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch(`${config.apiUrl}/api/users/me`, {
                    headers: {
                        Authorization: `Bearer ${getAccessToken()}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        navigate('/profile');
                    }
                } else {
                    navigate('/sign-in');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                navigate('/sign-in');
            }
        };

        checkAdminStatus();
    }, [navigate]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleTabClick = (tabName) => {
        setSelectedTab(tabName);
    };

    const handleFileManagerOpen = () => {
        const fileManager = document.querySelector('my-file-manager');
        if (fileManager) {
            fileManager.removeAttribute('hidden');
        }
    };

    const drawer = (
        <div>
            <Toolbar />
            <List>
                {[
                    {
                        text: 'Dashboard',
                        icon: <DashboardIcon />,
                        key: 'dashboard',
                    },
                    {
                        text: 'File Manager',
                        icon: <FolderIcon />,
                        key: 'file-manager',
                    },
                    { text: 'Users', icon: <PeopleIcon />, key: 'users' },
                    {
                        text: 'Settings',
                        icon: <SettingsIcon />,
                        key: 'settings',
                    },
                ].map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => handleTabClick(item.key)}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    const renderContent = () => {
        switch (selectedTab) {
            case 'dashboard':
                return <Typography>Dashboard Content</Typography>;
            case 'file-manager':
                return <FileManagerWrapper />;
            case 'users':
                return <Typography>Users Management</Typography>;
            case 'settings':
                return <Typography>Admin Settings</Typography>;
            default:
                return <Typography>Select a tab</Typography>;
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <ThemeProvider theme={LPtheme}>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                }}
            >
                <AppBar
                    position="fixed"
                    sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={() => navigate('/')}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            AdminPanel
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box sx={{ display: 'flex', flexGrow: 1 }}>
                    <Box
                        component="nav"
                        sx={{
                            width: { sm: drawerWidth },
                            flexShrink: { sm: 0 },
                        }}
                    >
                        <Drawer
                            variant="temporary"
                            open={mobileOpen}
                            onClose={handleDrawerToggle}
                            ModalProps={{ keepMounted: true }}
                            sx={{
                                display: { xs: 'block', sm: 'none' },
                                '& .MuiDrawer-paper': {
                                    boxSizing: 'border-box',
                                    width: drawerWidth,
                                },
                            }}
                        >
                            {drawer}
                        </Drawer>
                        <Drawer
                            variant="permanent"
                            sx={{
                                display: { xs: 'none', sm: 'block' },
                                '& .MuiDrawer-paper': {
                                    boxSizing: 'border-box',
                                    width: drawerWidth,
                                },
                            }}
                            open
                        >
                            {drawer}
                        </Drawer>
                    </Box>
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            p: 3,
                            width: { sm: `calc(100% - ${drawerWidth}px)` },
                            mt: '64px', // Добавляем отступ сверху
                        }}
                    >
                        {renderContent()}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
