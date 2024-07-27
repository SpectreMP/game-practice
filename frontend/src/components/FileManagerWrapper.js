import React, { useEffect, useRef, useState } from 'react';
import { FileManager } from 'filemanager-element';
import 'filemanager-element/FileManager.css';
import config from '../../config';
import { getAccessToken } from '../utils/auth';
import { Box, Button } from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';

const FileManagerWrapper = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const fileManagerRef = useRef(null);

    useEffect(() => {
        const setupFileManager = async () => {
            FileManager.register('my-file-manager', {
                endpoint: `${config.apiUrl}/api`,
                httpHeaders: {
                    Authorization: `Bearer ${getAccessToken()}`,
                },
            });
        };

        setupFileManager();
        const fileManager = document.querySelector('my-file-manager');

        fileManager.addEventListener('selectfile', (e) => {
            console.log('fileselect', e.detail);
            setSelectedFile(e.detail);
        });
        // fileManager.addEventListener('close', (e) => {
        //     e.currentTarget.setAttribute('hidden', '');
        //     console.log('close');
        // });
    }, []);

    const handleDownload = async () => {
        if (selectedFile) {
            try {
                const response = await axios.get(
                    `${config.apiUrl}/api/files/${selectedFile.id}/download`,
                    {
                        responseType: 'blob',
                        headers: {
                            Authorization: `Bearer ${getAccessToken()}`,
                        },
                    }
                );

                const url = window.URL.createObjectURL(
                    new Blob([response.data])
                );
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', selectedFile.name);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Ошибка при скачивании файла', error);
            }
        }
    };

    const StyledBox = styled(Box)(({ theme }) => ({
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%)',
        width: '50vw',
        height: '60vh', // Увеличиваем высоту
        maxWidth: '800px',
        maxHeight: '600px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[24],
        padding: theme.spacing(4),
        borderRadius: theme.shape.borderRadius,
        outline: 'none',
    }));
    
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between', 
                width: '100%',
                height: '80vh',
                position: 'relative',
                padding: '20px 0', 
            }}
        >
            <Box sx={{ width: '100%', height: '70%', position: 'relative' }}>
                <StyledBox>
                    <my-file-manager lazy-folders />
                </StyledBox>
            </Box>
            <Box
                sx={{
                    width: '50vw',
                    maxWidth: '800px',
                    marginTop: '20px',  
                }}
            >
                {selectedFile && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleDownload}
                        fullWidth
                    >
                        Скачать {selectedFile.name}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default FileManagerWrapper;
