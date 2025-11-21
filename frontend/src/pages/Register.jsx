// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Box, Button, Typography, Avatar, CircularProgress, Fade, useMediaQuery, useTheme } from '@mui/material';
import { PersonAddAlt } from '@mui/icons-material';

import { useRegisterForm } from '../hooks/useRegisterForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import { VisualSection } from '../components/auth/VisualSection';
import { EmailField } from '../components/ui/EmailField';
import { PasswordField } from '../components/ui/PasswordField';
import { authStyles, PRIMARY_GREEN, ACCENT_ORANGE } from '../styles/authStyles';
import logoImageSrc from '../assets/logo-texte.png';

export default function RegisterPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [isHovered, setIsHovered] = useState(false);

    const { 
        email, password, confirmPassword, loading, emailError, 
        handleEmailChange, handleSubmit,
        showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword,
        setPassword, setConfirmPassword,
        ...snackbarProps 
    } = useRegisterForm();

    const handleLogin = (e) => { 
        e.preventDefault(); 
        navigate({ to: '/login' }); 
    };

    const visual = (
        <VisualSection
            title="Rejoignez notre communauté agricole"
            text="Accédez à des outils puissants pour optimiser votre production et suivre vos cultures en temps réel."
        />
    );

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
                        <PersonAddAlt sx={{ fontSize: isSmallScreen ? 20 : 24 }} />
                    </Avatar>
                </Fade>
            </Box>

            <Box sx={authStyles.titleSection}>
                <Typography variant={isSmallScreen ? "h5" : "h4"} sx={authStyles.welcomeTitle}>
                    Rejoignez-nous !
                </Typography>
                <Typography variant="body2" sx={authStyles.subtitle}>
                    Créez votre compte pour commencer à utiliser nos services
                </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
                <EmailField 
                    value={email} 
                    onChange={handleEmailChange} 
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
                />
                
                <PasswordField 
                    label="Confirmer le mot de passe"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    showPassword={showConfirmPassword} 
                    setShowPassword={setShowConfirmPassword}
                    isSmallScreen={isSmallScreen}
                    sx={{ mb: 3 }}
                />

                <Button
                    type="submit" 
                    fullWidth 
                    variant="contained" 
                    sx={authStyles.submitButton(isSmallScreen)} 
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Créer mon compte'}
                </Button>
            </Box>

            <Typography variant="body2" sx={authStyles.subtitle}>
                Déjà un compte ? 
                <Typography component="button" onClick={handleLogin} sx={authStyles.linkButton}>
                    Se connecter
                </Typography>
            </Typography>
            
            <Typography variant="caption" sx={authStyles.copyright}>
                © 2024 OrientMada. Tous droits réservés.
            </Typography>
        </AuthLayout>
    );
}