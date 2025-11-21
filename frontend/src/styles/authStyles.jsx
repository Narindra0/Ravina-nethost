// src/styles/authStyles.js
import React from 'react';

// Palette de couleurs modernisée
export const PRIMARY_GREEN = '#2e7d32';
export const DARK_GREEN = '#1b5e20';
export const LIGHT_GREEN = '#4caf50';
export const ACCENT_ORANGE = '#ff9800';
export const ACCENT_ORANGE_LIGHT = '#ffb74d';
export const ERROR_RED = '#d32f2f';
export const WHITE = '#ffffff';

export const authStyles = {
        // Conteneur principal avec dégradé animé
        container: {
           minHeight: '100vh',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           background: `linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff8e1 100%)`,
           fontFamily: 'Poppins, Arial, sans-serif',
           p: { xs: 1, sm: 2 },
           position: 'relative',
           overflow: 'hidden',
           '&::before': {
             content: '""',
             position: 'absolute',
             top: '-50%',
             right: '-50%',
             width: '100%',
             height: '100%',
             background: 'radial-gradient(circle, rgba(46, 125, 50, 0.1) 0%, transparent 70%)',
             animation: 'float 20s ease-in-out infinite',
           },
           '@keyframes float': {
             '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
             '50%': { transform: 'translate(30px, 30px) rotate(180deg)' },
           }
        },

        // Paper principal avec effet glassmorphism
        paper: {
           width: '100%',
           maxWidth: 950,
           minHeight: { xs: 'auto', md: 520 },
           borderRadius: 3,
           overflow: 'hidden',
           display: 'flex',
           flexDirection: { xs: 'column', md: 'row' },
           transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
           boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
           backdropFilter: 'blur(20px)',
           background: 'rgba(255, 255, 255, 0.95)',
           position: 'relative',
           zIndex: 1,
           '&:hover': {
             boxShadow: '0 30px 80px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(46, 125, 50, 0.1)',
             transform: 'translateY(-2px)',
           }
        },

        // Partie formulaire
        formContainer: {
           flex: 1,
           minWidth: { xs: '100%', md: 400 },
           maxWidth: { xs: '100%', md: 450 },
           p: { xs: 2.5, sm: 3, md: 3.5 },
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'center',
           background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 249, 250, 0.6) 100%)',
           position: 'relative',
        },

        // Contenu du formulaire centré
        formContent: {
           width: '100%',
           maxWidth: 400,
           mx: 'auto',
           display: 'flex',
           flexDirection: 'column',
           gap: 0.5,
        },

        // En-tête avec logo
        header: {
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           mb: 2,
           animation: 'fadeInDown 0.6s ease-out',
           '@keyframes fadeInDown': {
             from: { opacity: 0, transform: 'translateY(-20px)' },
             to: { opacity: 1, transform: 'translateY(0)' },
           }
        },

        // Style de l'image du logo
        logoImage: {
           height: { xs: 32, sm: 38, md: 60 },
           width: 'auto',
           objectFit: 'contain',
           animation: 'fadeInLeft 0.6s ease-out',
           '@keyframes fadeInLeft': {
             from: { opacity: 0, transform: 'translateX(-20px)' },
             to: { opacity: 1, transform: 'translateX(0)' },
           }
        },
    
    // Titre principal pour Register
    mainTitle: {
        fontWeight: 700,
        fontSize: { xs: '1.4rem', sm: '1.7rem', md: '1.9rem' },
        lineHeight: 1.3,
    },

        // Avatar avec animation et effets 3D
        avatar: (isSmallScreen, isHovered) => ({
           background: `linear-gradient(135deg, ${ACCENT_ORANGE} 0%, ${ACCENT_ORANGE_LIGHT} 100%)`,
           width: isSmallScreen ? 42 : 48,
           height: isSmallScreen ? 42 : 48,
           transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
           transform: isHovered ? 'scale(1.15) rotate(12deg)' : 'scale(1) rotate(0deg)',
           boxShadow: isHovered  
             ? `0 12px 24px rgba(255, 152, 0, 0.4), 0 0 0 4px rgba(255, 152, 0, 0.1)`
             : '0 4px 12px rgba(255, 152, 0, 0.2)',
           cursor: 'pointer',
        }),

        // Section titre
        titleSection: {
           textAlign: 'center',
           mb: 2.5,
           animation: 'fadeIn 0.8s ease-out 0.2s both',
           '@keyframes fadeIn': {
             from: { opacity: 0, transform: 'translateY(10px)' },
             to: { opacity: 1, transform: 'translateY(0)' },
           }
        },

        // Titre de bienvenue avec effet
        welcomeTitle: {
           fontWeight: 700,
           background: `linear-gradient(135deg, ${PRIMARY_GREEN} 0%, ${DARK_GREEN} 100%)`,
           WebkitBackgroundClip: 'text',
           WebkitTextFillColor: 'transparent',
           backgroundClip: 'text',
           fontSize: { xs: '1.4rem', sm: '1.7rem', md: '1.9rem' },
           mb: 0.5,
           letterSpacing: '-0.01em',
        },

        // Sous-titre amélioré
        subtitle: {
           color: 'text.secondary',
           fontSize: { xs: '0.85rem', sm: '0.9rem' },
           fontWeight: 400,
           lineHeight: 1.5,
        },

        // Champs de formulaire
        textField: {
           mb: 2,
           '& .MuiOutlinedInput-root': {
             borderRadius: 2,
             transition: 'all 0.3s ease',
             backgroundColor: 'rgba(255, 255, 255, 0.8)',
             '&:hover': {
              backgroundColor: WHITE,
              '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: LIGHT_GREEN,
                      borderWidth: 2,
              }
             },
             '&.Mui-focused': {
              backgroundColor: WHITE,
              boxShadow: `0 0 0 4px rgba(46, 125, 50, 0.08)`,
              '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: PRIMARY_GREEN,
                      borderWidth: 2,
              }
             }
           },
           '& .MuiInputLabel-root.Mui-focused': {
             color: PRIMARY_GREEN,
             fontWeight: 600,
           }
        },

        // Bouton de lien (Mot de passe oublié, S'inscrire)
        linkButton: {
           color: ACCENT_ORANGE,
           textDecoration: 'none',
           fontSize: { xs: '0.8rem', sm: '0.85rem' },
           fontWeight: 600,
           border: 'none',
           background: 'none',
           cursor: 'pointer',
           transition: 'all 0.3s ease',
           position: 'relative',
           ml: 0.5,
           '&:hover': {  
             color: PRIMARY_GREEN,
             transform: 'translateX(2px)',
           },
           '&::after': {
             content: '""',
             position: 'absolute',
             bottom: -2,
             left: 0,
             width: 0,
             height: 2,
             background: PRIMARY_GREEN,
             transition: 'width 0.3s ease',
           },
           '&:hover::after': {
             width: '100%',
           }
        },

        // Bouton de connexion/inscription avec dégradé et animations
        submitButton: (isSmallScreen) => ({
           py: isSmallScreen ? 1.1 : 1.3,
           background: `linear-gradient(135deg, ${PRIMARY_GREEN} 0%, ${LIGHT_GREEN} 100%)`,
           fontSize: { xs: '0.9rem', sm: '0.95rem' },
           fontWeight: 700,
           mb: 2.5,
           borderRadius: 2,
           textTransform: 'none',
           letterSpacing: '0.02em',
           position: 'relative',
           overflow: 'hidden',
           transition: 'all 0.3s ease',
           boxShadow: `0 4px 16px rgba(46, 125, 50, 0.3)`,
           '&:hover': {  
             background: `linear-gradient(135deg, ${DARK_GREEN} 0%, ${PRIMARY_GREEN} 100%)`,
             transform: 'translateY(-2px)',
             boxShadow: `0 8px 24px rgba(46, 125, 50, 0.4)`,
           },
           '&:active': {
             transform: 'translateY(0)',
           }
        }),

        // Copyright
        copyright: {
           textAlign: 'center',
           color: 'text.disabled',
           display: 'block',
           mt: 2,
           fontSize: { xs: '0.7rem', sm: '0.73rem' },
           fontWeight: 400,
        },

        // Partie visuelle droite
        visualSection: {
           flex: 1,
           minWidth: 420,
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'center',
           alignItems: 'center',
           background: `linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(27, 94, 32, 0.95) 100%)`,
           backgroundImage: `
             linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(27, 94, 32, 0.95) 100%),    
             url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80)
           `,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           color: 'white',
           p: 3,
           position: 'relative',
           overflow: 'hidden',
        },

        // Carte glassmorphism
        visualCard: {
           p: 3,
           background: 'rgba(255, 255, 255, 0.15)',
           borderRadius: 2.5,
           maxWidth: 400,
           textAlign: 'center',
           border: '1px solid rgba(255, 255, 255, 0.2)',
           borderLeft: `4px solid ${ACCENT_ORANGE}`,
           backdropFilter: 'blur(20px) saturate(180%)',
           boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
           transition: 'all 0.4s ease',
        },

        // Titre de la section visuelle
        visualTitle: {
           fontWeight: 700,
           mb: 1.5,
           color: WHITE,
           fontSize: { md: '1.25rem', lg: '1.4rem' },
           lineHeight: 1.3,
        },

        // Texte de la section visuelle
        visualText: {
           color: 'rgba(255, 255, 255, 0.95)',
           lineHeight: 1.6,
           fontSize: { md: '0.9rem', lg: '1rem' },
        },

        // Snackbar personnalisé
        snackbarAlert: {
           borderRadius: 2.5,
           fontWeight: 600,
           fontSize: '0.95rem',
           minWidth: 320,
           backdropFilter: 'blur(10px)',
        }
};