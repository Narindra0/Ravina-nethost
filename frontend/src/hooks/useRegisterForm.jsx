// src/hooks/useRegisterForm.js
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthForm } from './useAuthForm';
import { useSnackbar } from './useSnackbar';
import { api } from '../lib/axios';

export function useRegisterForm() {
    const navigate = useNavigate();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { 
        email, password, loading, setLoading, 
        emailError, validateEmail, handleEmailChange,
        showPassword, setShowPassword,
        setPassword
    } = useAuthForm();
    const { showSnackbar, ...snackbarProps } = useSnackbar();

    // --- Logique de validation spécifique au Register ---
    const validate = () => {
        if (!email || !validateEmail(email)) {
            showSnackbar('Veuillez saisir une adresse email valide');
            return false;
        }
        if (!password || password.length < 6) {
            showSnackbar('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        if (password !== confirmPassword) {
            showSnackbar('❌ Les mots de passe ne correspondent pas');
            return false;
        }
        return true;
    };
    
    // --- Logique de soumission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/register', { email, password });
            
            showSnackbar('🎉 Compte créé avec succès ! Redirection en cours...', 'success');
            
            setTimeout(() => {
                navigate({ to: '/login?registered=1' });
            }, 2000);
            
        } catch (error) {
            console.error(error);
            if (error.response?.status === 409) {
                showSnackbar('📧 Un compte existe déjà avec cet email.');
            } else {
                showSnackbar('❌ Une erreur est survenue lors de l\'inscription.');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        email, password, loading, emailError, handleEmailChange, handleSubmit,
        showPassword, setShowPassword, 
        confirmPassword, setConfirmPassword, 
        showConfirmPassword, setShowConfirmPassword,
        setPassword,
        ...snackbarProps,
    };
}