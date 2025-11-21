// src/components/auth/VisualSection.jsx
import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { authStyles } from '../../styles/authStyles';

export function VisualSection({ title, text }) {
    return (
        <Box sx={authStyles.visualSection}>
            <Fade in timeout={1000}>
                <Box sx={authStyles.visualCard}>
                    <Typography 
                        variant="h5" 
                        sx={authStyles.visualTitle}
                    >
                        {title}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={authStyles.visualText}
                    >
                        {text}
                    </Typography>
                </Box>
            </Fade>
        </Box>
    );
}