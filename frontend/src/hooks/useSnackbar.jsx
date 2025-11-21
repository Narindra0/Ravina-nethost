// src/hooks/useSnackbar.js
import { useState, useCallback } from 'react';

export function useSnackbar() {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');

    const showSnackbar = useCallback((message, severity = 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    const handleSnackbarClose = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    }, []);

    return {
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity,
        showSnackbar,
        handleSnackbarClose,
    };
}