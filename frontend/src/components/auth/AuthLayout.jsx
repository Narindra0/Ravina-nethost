// src/components/auth/AuthLayout.jsx
import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { authStyles } from '../../styles/authStyles';
import { SnackbarAlert } from '../ui/SnackbarAlert';

export function AuthLayout({ children, visualSection, snackbarProps }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={authStyles.container}>
            <Paper sx={authStyles.paper}>
                {/* 1. Formulaire (FormContainer) */}
                <Box sx={authStyles.formContainer}>
                    <Box sx={authStyles.formContent}>
                        {children}
                    </Box>
                </Box>

                {/* 2. Visuel (VisualSection) */}
                {!isMobile && visualSection}
            </Paper>

            {/* 3. Snackbar */}
            <SnackbarAlert {...snackbarProps} />
        </Box>
    );
}