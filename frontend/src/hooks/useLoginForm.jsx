// src/hooks/useLoginForm.js (CORRIGÉ)
import { useNavigate } from '@tanstack/react-router';
import { useAuthForm } from './useAuthForm';
import { useSnackbar } from './useSnackbar';
import { api } from '../lib/axios';
import { authStore } from '../store/auth';

export function useLoginForm() {
    const navigate = useNavigate();
    const { 
        email, setEmail, 
        password, setPassword, // ✅ setPassword est bien retourné
        loading, setLoading, 
        emailError, setEmailError, 
        validateEmail, handleEmailChange, handleEmailBlur,
        showPassword, setShowPassword
    } = useAuthForm();
    const { showSnackbar, ...snackbarProps } = useSnackbar();
    
    // --- Logique de validation spécifique au Login ---
    const validate = () => {
        // ... (validation inchangée)
        if (!email) {
            showSnackbar("L'adresse email est requise");
            return false;
        }
        if (!validateEmail(email)) {
            showSnackbar('Veuillez saisir une adresse email valide');
            setEmailError('invalid');
            return false;
        }
        if (!password || password.length < 6) {
            showSnackbar('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        return true;
    };

    // --- Logique de soumission ---
    const handleSubmit = async (e) => {
        // ... (logique de soumission inchangée)
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/login', { email, password });
            const token = res.data.token;
            authStore.setToken(token);
            
            showSnackbar('🎉 Connexion réussie ! Redirection en cours...', 'success');
            navigate({ to: '/dashboard' });

        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                showSnackbar('🔐 Identifiants incorrects.');
            } else if (err.response?.status === 404) {
                showSnackbar('👤 Aucun compte trouvé avec cet email.');
            } else {
                showSnackbar('❌ Une erreur est survenue. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        email, setEmail, 
        password, setPassword, // ✅ setPassword est inclus ici pour être utilisé dans le JSX
        loading, 
        emailError, handleEmailChange, handleEmailBlur, handleSubmit,
        showPassword, setShowPassword, ...snackbarProps, showSnackbar,
    };
}