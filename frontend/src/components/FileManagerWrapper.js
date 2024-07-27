/**
 * A wrapper for the file manager component.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FileManager } from 'filemanager-element';
import 'filemanager-element/FileManager.css';
import config from '../../config';
import { getAccessToken } from '../utils/auth';
import { Button, Box } from '@mui/material';
import axios from 'axios';

const FileManagerWrapper = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isFileManagerVisible, setIsFileManagerVisible] = useState(true);
    const fileManagerRef = useRef(null);

    useEffect(() => {
        const setupFileManager = async () => {
            if (!fileManagerRef.current) return;

            await FileManager.register('my-file-manager', {
                endpoint: `${config.apiUrl}/api`,
                httpHeaders: {
                    Authorization: `Bearer ${getAccessToken()}`,
                },
                createFolder: async (params) => {
                    try {
                        const response = await axios.post(`${config.apiUrl}/api/folders`, params, {
                            headers: {
                                Authorization: `Bearer ${getAccessToken()}`,
                            },
                        });
                        return response.data;
                    } catch (error) {
                        console.error('Error creating folder:', error.response?.data || error.message);
                        throw error;
                    }
                },
            });

            const fileManagerElement = fileManagerRef.current;
            fileManagerElement.addEventListener('selectfile', (event) => {
                setSelectedFile(event.detail);
            });
            fileManagerElement.addEventListener('close', () => {
                setIsFileManagerVisible(false);
            });
        };

        setupFileManager();

        return () => {
            if (fileManagerRef.current) {
                fileManagerRef.current.removeEventListener('selectfile', () => {});
                fileManagerRef.current.removeEventListener('close', () => {});
            }
        };
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

                const url = window.URL.createObjectURL(new Blob([response.data]));
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

    
    const handleShowFileManager = () => {
        setIsFileManagerVisible(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Button variant="contained" color="primary" onClick={handleShowFileManager} sx={{ mb: 2 }}>
                Show File Manager
            </Button>
            {isFileManagerVisible && (
                <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                    <my-file-manager
                        ref={fileManagerRef}
                        lazy-folders="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </Box>
            )}
            {selectedFile && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDownload}
                    sx={{ mt: 2 }}
                >
                    Скачать {selectedFile.name}
                </Button>
            )}
        </Box>
    );
};

export default FileManagerWrapper;