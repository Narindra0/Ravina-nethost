// src/hooks/useAuthForm.js
import { useState, useCallback } from 'react';

// Fonction utilitaire de validation
const validateEmailUtil = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export function useAuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = useCallback(validateEmailUtil, []);

    const handleEmailChange = useCallback((e) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) {
            setEmailError('');
        }
    }, [emailError]);

    const handleEmailBlur = useCallback(() => {
        if (email && !validateEmail(email)) {
            setEmailError('invalid');
        } else {
            setEmailError('');
        }
    }, [email, validateEmail]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        setLoading,
        showPassword,
        setShowPassword,
        emailError,
        setEmailError,
        validateEmail,
        handleEmailChange,
        handleEmailBlur,
    };
}