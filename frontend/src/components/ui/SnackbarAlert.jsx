// src/components/ui/SnackbarAlert.jsx
import React from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { authStyles } from '../../styles/authStyles';

// Composant Alert personnalisé
const CustomAlert = React.forwardRef(function CustomAlert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function SnackbarAlert({ open, message, severity, onClose }) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <CustomAlert
                onClose={onClose}
                severity={severity}
                sx={authStyles.snackbarAlert}
            >
                {message}
            </CustomAlert>
        </Snackbar>
    );
}