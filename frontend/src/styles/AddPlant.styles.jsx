const PRIMARY_GREEN = '#4CAF50'; // Vert d'accentuation (pour les actions positives)
const ACCENT_ORANGE = '#FF7F00';
// Nouveau : Couleur principale pour le texte et les éléments sombres
const PRIMARY_ACTION_COLOR = '#1A1A1A'; // Gris très foncé/noir pour le contraste

export const addPlantStyles = {
    // 1. MODAL BOX (Amélioration de l'ombre et responsivité)
    modalBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: '85%', md: 700, lg: 750 },
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'white',
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 8px 16px rgba(17, 24, 39, 0.1), 0 4px 8px rgba(17, 24, 39, 0.05)',
        p: { xs: 3, sm: 4, md: 5 },
        outline: 'none',
    },

    // 2. MODAL HEADER (Reste épuré)
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        mb: 4, // Plus d'espace sous l'en-tête
        pb: 2,
        borderBottom: '1px solid #e5e7eb',
    },

    // 3. MODAL TITLE (Utilisation de la couleur d'action pour le titre)
    modalTitle: {
        fontWeight: 700,
        color: PRIMARY_ACTION_COLOR, // Titre bien sombre
        flexGrow: 1,
        fontSize: { xs: '1.5rem', sm: '1.8rem' }, // Plus grand
        ml: 1,
    },

    // 4. CLOSE ICON (Maintient le vert au hover)
    closeIcon: {
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'color 0.2s',
        zIndex: 10,
        '&:hover': {
            color: PRIMARY_GREEN,
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
        },
    },

    // 5. TITRE DE SECTION (Maintient le vert au hover)
    sectionTitle: {
        fontWeight: 600,
        color: PRIMARY_ACTION_COLOR,
        fontSize: '1.3rem', // Plus mis en évidence
        mb: 2,
        mt: 4, // Plus d'espace au-dessus
        borderBottom: '1px solid #e5e7eb',
        pb: 0.5,
    },

    layout: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 3, md: 4 },
    },

    templatePanel: {
        flexBasis: { md: '35%' },
        flexShrink: 0,
        backgroundColor: '#f9fafb',
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        p: { xs: 2.5, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
    },

    panelSubtitle: {
        fontWeight: 600,
        color: '#1f2937',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontSize: '0.75rem',
    },

    templateCard: {
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },

    templateImageWrapper: {
        width: '100%',
        aspectRatio: '4 / 3',
        backgroundColor: '#eef2ff',
        overflow: 'hidden',
    },

    templateInfo: {
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },

    templateTitle: {
        fontWeight: 700,
        fontSize: '1rem',
        color: PRIMARY_ACTION_COLOR,
    },

    templateMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },

    templateMetaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
    },

    templateMetaLabel: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 500,
    },

    templateMetaValue: {
        fontSize: '0.9rem',
        color: '#1f2937',
        fontWeight: 600,
        textAlign: 'right',
    },

    formSection: {
        flex: 1,
    },

    // 9. SUBMIT BUTTON (Style plus plat et moderne)
    submitButton: {
        py: 1.5,
        px: 4,
        fontSize: '1.0rem',
        borderRadius: '10px', // Très arrondi
        bgcolor: PRIMARY_GREEN,
        color: 'white',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: '#388E3C', // Vert foncé
            boxShadow: '0 4px 8px rgba(76, 175, 80, 0.4)', // Ombre subtile au hover
        },
        '&:disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        }
    },

    // 10. FORM CONTROL (Amélioration du focus et du rayon + hauteur uniforme)
    formControl: {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            minHeight: '48px',
            '&.Mui-focused fieldset': {
                borderColor: PRIMARY_GREEN,
                borderWidth: '2px',
            },
            '&:hover fieldset': {
                borderColor: PRIMARY_GREEN,
            }
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: PRIMARY_GREEN,
        },
    },

    selectControl: {
        width: { xs: '100%', md: 300 },
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            minHeight: '48px',
            '&.Mui-focused fieldset': {
                borderColor: PRIMARY_GREEN,
                borderWidth: '2px',
            },
            '&:hover fieldset': {
                borderColor: PRIMARY_GREEN,
            },
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: PRIMARY_GREEN,
        },
    },

    // Note field (style uniforme avec les autres champs)
    notesControl: {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            '&.Mui-focused fieldset': {
                borderColor: PRIMARY_GREEN,
                borderWidth: '2px',
            },
            '&:hover fieldset': {
                borderColor: PRIMARY_GREEN,
            }
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: PRIMARY_GREEN,
        },
    },

    // 11. IMAGE UPLOAD CONTAINER
    imageUploadContainer: {
        p: 3,
        borderRadius: 3,
        border: '1px dashed #cbd5e1',
        backgroundColor: '#f8fafc',
    },

    imageUploadHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        mb: 2,
    },

    imageDropZone: {
        borderRadius: 3,
        border: `2px dashed ${PRIMARY_GREEN}`,
        backgroundColor: 'white',
        textAlign: 'center',
        p: { xs: 2.5, md: 3 },
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
            borderColor: '#2e7d32',
            boxShadow: '0 12px 20px rgba(16, 185, 129, 0.12)',
        },
    },

    imageHelperText: {
        color: '#64748b',
        fontSize: '0.9rem',
    },

    imagePreviewWrapper: {
        position: 'relative',
        marginTop: 2,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        maxWidth: 360,
        mx: 'auto',
    },

    imagePreview: {
        width: '100%',
        display: 'block',
        aspectRatio: '4 / 3',
        objectFit: 'cover',
    },

    imagePreviewOverlay: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        p: 1,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 100%)',
    },

    // STEPPER STYLES
    stepperContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #e5e7eb',
    },

    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },

    stepCircle: (isActive, isCompleted) => ({
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.95rem',
        transition: 'all 0.3s ease',
        bgcolor: isCompleted ? PRIMARY_GREEN : isActive ? PRIMARY_GREEN : '#e5e7eb',
        color: isCompleted || isActive ? 'white' : '#6b7280',
        border: isActive ? `2px solid ${PRIMARY_GREEN}` : '2px solid transparent',
    }),

    stepLabel: (isActive) => ({
        fontWeight: isActive ? 600 : 500,
        fontSize: '0.9rem',
        color: isActive ? PRIMARY_ACTION_COLOR : '#6b7280',
    }),

    stepDivider: {
        width: { xs: 30, sm: 50 },
        height: 2,
        bgcolor: '#e5e7eb',
    },

    // NAVIGATION BUTTONS
    navigationButtons: {
        display: 'flex',
        gap: 2,
        mt: 3,
    },

    backButton: {
        py: 1.5,
        px: 3,
        fontSize: '1.0rem',
        borderRadius: '10px',
        bgcolor: 'transparent',
        color: '#6b7280',
        fontWeight: 600,
        textTransform: 'none',
        border: '2px solid #e5e7eb',
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: '#f9fafb',
            borderColor: '#d1d5db',
        },
    },

    nextButton: {
        py: 1.5,
        px: 4,
        fontSize: '1.0rem',
        borderRadius: '10px',
        bgcolor: PRIMARY_GREEN,
        color: 'white',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.3s ease',
        flex: 1,
        '&:hover': {
            bgcolor: '#388E3C',
            boxShadow: '0 4px 8px rgba(76, 175, 80, 0.4)',
        },
        '&:disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        }
    },
};

export { PRIMARY_GREEN, ACCENT_ORANGE, PRIMARY_ACTION_COLOR };