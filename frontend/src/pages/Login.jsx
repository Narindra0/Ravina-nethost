// src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { authStore } from '../store/auth';
import { Box, Button, Typography, Avatar, CircularProgress, Fade, Dialog, DialogContent, DialogActions, useMediaQuery, useTheme } from '@mui/material';
import { Cloud, Campaign } from '@mui/icons-material';

import { useLoginForm } from '../hooks/useLoginForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import { VisualSection } from '../components/auth/VisualSection';
import { EmailField } from '../components/ui/EmailField';
import { PasswordField } from '../components/ui/PasswordField';
import { authStyles } from '../styles/authStyles';
import logoImageSrc from '../assets/logo-texte.png';

export default function LoginPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isHovered, setIsHovered] = useState(false);
    const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);

    const {
        email, password, setPassword, loading, emailError,
        handleEmailChange, handleEmailBlur, handleSubmit,
        showPassword, setShowPassword, showSnackbar,
        ...snackbarProps
    } = useLoginForm();

    const handleForgotPassword = (e) => {
        e.preventDefault();
        setForgotPasswordDialogOpen(true);
    };

    const handleForgotPasswordDialogClose = () => {
        setForgotPasswordDialogOpen(false);
    };

    const handleRegister = (e) => {
        e.preventDefault();
        navigate({ to: '/register' });
    };

    const visual = (
        <VisualSection
            title="Des données précises pour une agriculture intelligente"
            text="Accédez à des prévisions météo hyper-locales et surveillez la santé de vos cultures en temps réel."
        />
    );

    useEffect(() => {
        // Redirect to dashboard if user is already authenticated
        if (authStore.isAuthenticated()) {
            navigate({ to: '/dashboard', replace: true });
            return;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === '1') {
            showSnackbar('✅ Compte créé avec succès. Vous pouvez vous connecter.', 'success');
            navigate({ to: '/login', replace: true });
        }
    }, [navigate, showSnackbar]);

    return (
        <AuthLayout visualSection={visual} snackbarProps={snackbarProps}>
            <Box sx={authStyles.header}>
                <Box component="img" src={logoImageSrc} alt="OrientMada Logo" sx={authStyles.logoImage} />
                <Fade in timeout={800}>
                    <Avatar
                        sx={authStyles.avatar(isSmallScreen, isHovered)}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <Cloud sx={{ fontSize: isSmallScreen ? 20 : 24 }} />
                    </Avatar>
                </Fade>
            </Box>

            <Box sx={authStyles.titleSection}>
                <Typography variant={isSmallScreen ? "h5" : "h4"} sx={authStyles.welcomeTitle}>
                    Content de vous revoir !
                </Typography>
                <Typography variant="body2" sx={authStyles.subtitle}>
                    Connectez-vous pour accéder à votre tableau de bord
                </Typography>
            </Box>

            <Box
                component="form"
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSubmit(e);
                    }
                }}
            >
                <EmailField
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    emailError={emailError}
                    isSmallScreen={isSmallScreen}
                />

                <PasswordField
                    label="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    isSmallScreen={isSmallScreen}
                    sx={{ mb: 1 }}
                />

                <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <Typography component="button" onClick={handleForgotPassword} sx={{ ...authStyles.linkButton, ml: 0 }}>
                        Mot de passe oublié ?
                    </Typography>
                </Box>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={authStyles.submitButton(isSmallScreen)}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
                </Button>
            </Box>

            <Typography variant="body2" sx={authStyles.subtitle}>
                Nouveau sur OrientMada ?
                <Typography component="button" onClick={handleRegister} sx={authStyles.linkButton}>
                    Créer un compte
                </Typography>
            </Typography>

            <Typography variant="caption" sx={authStyles.copyright}>
                © 2024 OrientMada. Tous droits réservés.
            </Typography>

            <Dialog
                open={forgotPasswordDialogOpen}
                onClose={handleForgotPasswordDialogClose}
                aria-labelledby="forgot-password-dialog-title"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        py: 1,
                        px: 1,
                        boxShadow: `0 30px 60px ${theme.palette.primary.main}33`,
                        width: 'min(420px, 90vw)',
                    },
                }}
            >
                <DialogContent
                    sx={{
                        textAlign: 'center',
                        px: { xs: 3, sm: 5 },
                        py: 4,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}11, ${theme.palette.primary.main}15)`,
                        borderRadius: 3,
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            mx: 'auto',
                            mb: 2,
                            width: 56,
                            height: 56,
                            boxShadow: `0 12px 30px ${theme.palette.primary.main}55`,
                        }}
                    >
                        <Campaign />
                    </Avatar>
                    <Typography id="forgot-password-dialog-title" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Oups&nbsp;!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Inspirer... Expirer... Ah&nbsp;! C'est le bouton « Mot de passe oublié ».
                        Reprenez votre souffle et réessayez à nouveau. Tout va bien se passer&nbsp;!
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
                        onClick={handleForgotPasswordDialogClose}
                        sx={{
                            borderRadius: 999,
                            px: 4,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Continuer
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthLayout>
    );
}