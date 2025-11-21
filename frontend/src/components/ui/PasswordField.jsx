// src/components/ui/PasswordField.jsx
import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authStyles, ACCENT_ORANGE, PRIMARY_GREEN } from '../../styles/authStyles';

export function PasswordField({ 
    label, 
    value, 
    onChange, 
    showPassword, 
    setShowPassword, 
    isSmallScreen, 
    sx,
    ...props 
}) {
    return (
        <TextField
            label={label}
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            required
            value={value}
            onChange={onChange}
            sx={{ ...authStyles.textField, ...sx }}
            size={isSmallScreen ? "small" : "medium"}
            placeholder={`Votre ${label.toLowerCase()}`}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowPassword(prev => !prev)}
                            edge="end"
                            size={isSmallScreen ? "small" : "medium"}
                            sx={{ 
                                color: ACCENT_ORANGE,
                                '&:hover': { color: PRIMARY_GREEN }
                            }}
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            {...props}
        />
    );
}