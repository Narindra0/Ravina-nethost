// src/components/ui/EmailField.jsx
import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { authStyles, ERROR_RED } from '../../styles/authStyles';

export function EmailField({ 
    value, 
    onChange, 
    onBlur, 
    emailError, 
    isSmallScreen 
}) {
    return (
        <TextField
            label="Adresse Email"
            type="email"
            variant="outlined"
            fullWidth
            required
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={!!emailError}
            sx={authStyles.textField}
            size={isSmallScreen ? "small" : "medium"}
            placeholder="votre@email.com"
            InputProps={{
                endAdornment: emailError && (
                    <InputAdornment position="end">
                        <ErrorOutline sx={{ color: ERROR_RED, fontSize: 20 }} />
                    </InputAdornment>
                ),
            }}
            helperText={emailError ? "Format d'email invalide" : ""}
        />
    );
}