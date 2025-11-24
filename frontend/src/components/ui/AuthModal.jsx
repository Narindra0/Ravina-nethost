import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, Avatar, useTheme } from '@mui/material';
import { CheckCircle, ErrorOutline, Info, Campaign } from '@mui/icons-material';

export function AuthModal({
    open,
    onClose,
    type = 'info', // 'success', 'error', 'info', 'forgot-password'
    title,
    message,
    buttonText = 'Continuer',
    onButtonClick
}) {
    const theme = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle />;
            case 'error':
                return <ErrorOutline />;
            case 'forgot-password':
                return <Campaign />;
            default:
                return <Info />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return theme.palette.success.main;
            case 'error':
                return theme.palette.error.main;
            case 'forgot-password':
            default:
                return theme.palette.primary.main;
        }
    };

    const color = getColor();
    const icon = getIcon();

    console.log('AuthModal Render:', { open, type, title, message });

    const handleButtonClick = () => {
        if (onButtonClick) {
            onButtonClick();
        } else {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    py: 1,
                    px: 1,
                    boxShadow: `0 30px 60px ${color}33`,
                    width: 'min(420px, 90vw)',
                },
            }}
        >
            <DialogContent
                sx={{
                    textAlign: 'center',
                    px: { xs: 3, sm: 5 },
                    py: 4,
                    background: `linear-gradient(135deg, ${color}11, ${color}15)`,
                    borderRadius: 3,
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: color,
                        color: theme.palette.getContrastText(color),
                        mx: 'auto',
                        mb: 2,
                        width: 56,
                        height: 56,
                        boxShadow: `0 12px 30px ${color}55`,
                    }}
                >
                    {icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: type === 'error' ? color : 'inherit' }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions
                sx={{
                    justifyContent: 'center',
                    pb: 3,
                }}
            >
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleButtonClick}
                    sx={{
                        borderRadius: 999,
                        px: 4,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: color,
                        '&:hover': {
                            bgcolor: color,
                            filter: 'brightness(0.9)',
                        }
                    }}
                >
                    {buttonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
