import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
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
    Fade,
    Backdrop,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { FileManager } from 'filemanager-element';
import 'filemanager-element/FileManager.css';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';
import config from '../../config';


const drawerWidth = 240;

const StyledModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: '80%',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[24],
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    outline: 'none',
}));

export default function AdminPanel() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = React.useMemo(() => createTheme(getLPTheme(mode)), [mode]);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [selectedTab, setSelectedTab] = React.useState('dashboard');
    const [fileManagerOpen, setFileManagerOpen] = useState(false);
    const navigate = useNavigate();
    const fileManagerRef = useRef(null);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch(`${config.apiUrl}/api/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${getAccessToken()}`,
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

        FileManager.register('file-manager', {
            endpoint: `${config.apiUrl}/api`,
            httpHeaders: {
                Authorization: `Bearer ${getAccessToken()}`,
            },
        });

        const fileManagerElement = fileManagerRef.current;
        if (fileManagerElement) {
            fileManagerElement.addEventListener('close', handleFileManagerClose);
        }

        return () => {
            if (fileManagerElement) {
                fileManagerElement.removeEventListener('close', handleFileManagerClose);
            }
        };
    }, [navigate]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleTabClick = (tabName) => {
        setSelectedTab(tabName);
        if (tabName === 'file-manager') {
            setFileManagerOpen(true);
        }
    };

    const handleFileManagerClose = () => {
        setFileManagerOpen(false);
    };

    const handleModalClick = (event) => {
        event.stopPropagation();
    };

    const drawer = (
        <div>
            <Toolbar />
            <List>
                {[
                    { text: 'Dashboard', icon: <DashboardIcon />, key: 'dashboard' },
                    { text: 'File Manager', icon: <FolderIcon />, key: 'file-manager' },
                    { text: 'Users', icon: <PeopleIcon />, key: 'users' },
                    { text: 'Settings', icon: <SettingsIcon />, key: 'settings' },
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
        switch(selectedTab) {
            case 'dashboard':
                return <Typography>Dashboard Content</Typography>;
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
            <Box sx={{ display: 'flex' }}>
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                    }}
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
                        <IconButton color="inherit" onClick={() => navigate('/')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Admin Panel
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>
                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
                >
                    <Toolbar />
                    <Container maxWidth="lg">
                        <Paper elevation={3} sx={{ p: 4 }}>
                            {renderContent()}
                        </Paper>
                    </Container>
                </Box>
            </Box>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={fileManagerOpen}
            >
                <Fade in={fileManagerOpen}>
                    <StyledModal onClick={handleModalClick}>
                        <IconButton
                            aria-label="close"
                            onClick={handleFileManagerClose}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <file-manager
                            ref={fileManagerRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                        ></file-manager>
                    </StyledModal>
                </Fade>
            </Backdrop>
        </ThemeProvider>
    );
}