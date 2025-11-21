import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    IconButton,
    Alert,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import {
    Close,
    LocalFlorist,
    WaterDrop,
    WbSunny,
    CalendarMonth,
    LocationOn,
    Grass,
    InfoOutlined,
    AddCircleOutline,
    CloudUpload,
    DeleteOutline,
    ArrowForward,
    ArrowBack,
    CheckCircle,
} from '@mui/icons-material';

import { api } from '../lib/axios';
import { addPlantStyles, PRIMARY_GREEN } from '../styles/AddPlant.styles';

const plantTypes = ['Légume', 'Fruit', 'Fleur', 'Aromatique', 'Arbre', 'Autre'];
const sunExposures = ['Plein soleil', 'Mi-ombre', 'Ombre', 'Intérieur', 'Extérieur'];
const bestSeasons = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toute l\'année', 'Variable'];

export default function AddPlantModal({ open, onClose, onPlantAdded }) {
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        expectedHarvestDays: '',
        location: '',
        notes: '',
        bestSeason: '',
        wateringFrequency: '',
        sunExposure: '',
        cyclePhasesJson: '',
        wateringQuantityMl: '',
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 💡 Nettoyage de l'URL de prévisualisation lorsque le modal se ferme
    useEffect(() => {
        if (!open && imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    }, [open, imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 🚀 Gestion de l'upload d'image (clic + drag&drop) sans conversion
    const compressImageIfNeeded = async (file) => {
        // Ne pas convertir côté client, laisser l'extension d'origine
        return file;
    };

    const applySelectedFile = async (file) => {
        const maybeCompressed = await compressImageIfNeeded(file);
        setImageFile(maybeCompressed);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(maybeCompressed));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await applySelectedFile(file);
        } else {
            handleRemoveImage();
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) await applySelectedFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // 🚀 Fonction pour supprimer l'image
    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        // Important: Réinitialiser l'input file pour pouvoir re-téléverser le même fichier
        const uploadInput = document.getElementById("upload-image-button");
        if (uploadInput) {
            uploadInput.value = null;
        }
    }

    const validateForm = () => {
        if (!formData.name.trim() || !formData.type || !formData.location.trim()) {
            setError('Veuillez remplir les champs requis : Nom, Type, Lieu.');
            return false;
        }
        if (formData.expectedHarvestDays && Number(formData.expectedHarvestDays) < 0) {
            setError('Le nombre de jours estimés doit être positif.');
            return false;
        }
        if (formData.wateringQuantityMl && Number(formData.wateringQuantityMl) < 0) {
            setError('La quantité d\'arrosage doit être positive.');
            return false;
        }
        if (formData.wateringFrequency) {
            const freqValue = Number(formData.wateringFrequency);
            if (!Number.isFinite(freqValue) || freqValue <= 0) {
                setError('La fréquence d\'arrosage doit être un nombre positif.');
                return false;
            }
        }
        if (formData.cyclePhasesJson) {
            try {
                JSON.parse(formData.cyclePhasesJson);
            } catch {
                setError('Le champ Cycle des phases doit contenir un JSON valide.');
                return false;
            }
        }
        if (imageFile && !imageFile.type.startsWith('image/')) {
            setError('Le fichier sélectionné n\'est pas une image valide.');
            return false;
        }

        setError('');
        setSuccessMessage('');
        return true;
    };

    // Génère un cycle standard en fonction du nombre total de jours
    const generateCyclePhases = (totalDays) => {
        const safeDays = Math.max(0, parseInt(totalDays || 0, 10));
        if (!safeDays) return [];

        const sowing = Math.max(1, Math.round(safeDays * 0.15));
        const growth = Math.max(1, Math.round(safeDays * 0.55));
        const flowering = Math.max(0, Math.round(safeDays * 0.15));
        let harvest = safeDays - sowing - growth - flowering;
        if (harvest < 0) harvest = 0;

        const phases = [
            { phase: 'Semis', jours: sowing },
            { phase: 'Croissance', jours: growth },
        ];
        if (flowering > 0) phases.push({ phase: 'Floraison', jours: flowering });
        phases.push({ phase: 'Récolte', jours: harvest });
        return phases;
    };

    // Détecte si l'utilisateur a saisi manuellement un JSON non standard
    const isUserEditedJson = (value) => {
        try {
            const parsed = JSON.parse(value || '[]');
            return !Array.isArray(parsed) || parsed.some(p => typeof p.phase !== 'string' || typeof p.jours !== 'number');
        } catch {
            return !!value;
        }
    };

    // Auto-génère le cycle quand expectedHarvestDays change, sans écraser une saisie manuelle
    useEffect(() => {
        if (!formData.expectedHarvestDays) return;
        if (isUserEditedJson(formData.cyclePhasesJson)) return;
        const auto = generateCyclePhases(formData.expectedHarvestDays);
        setFormData(prev => ({ ...prev, cyclePhasesJson: JSON.stringify(auto) }));
    }, [formData.expectedHarvestDays]);

    const resetForm = () => {
        setCurrentStep(1);
        setFormData({
            name: '',
            type: '',
            expectedHarvestDays: '',
            location: '',
            notes: '',
            bestSeason: '',
            wateringFrequency: '',
            sunExposure: '',
            cyclePhasesJson: '',
            wateringQuantityMl: '',
        });
        handleRemoveImage();
        setError('');
        setSuccessMessage('');
    };

    const handleCloseModal = () => {
        resetForm();
        onClose();
    };

    // Validation de l'étape 1
    const isStep1Valid = () => {
        return formData.name.trim() && formData.type && formData.location.trim();
    };

    // Navigation vers l'étape 2
    const handleNext = () => {
        if (isStep1Valid()) {
            setError('');
            setCurrentStep(2);
        } else {
            setError('Veuillez remplir les champs requis : Nom, Type et Lieu.');
        }
    };

    // Retour à l'étape 1
    const handleBack = () => {
        setError('');
        setCurrentStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError('');

        try {
            let imageSlug = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append('file', imageFile);
                fd.append('name', formData.name || 'image');
                const uploadRes = await api.post('/upload/plant-template-image', fd, {
                    headers: { 'Accept': 'application/json' },
                });
                imageSlug = uploadRes.data?.imageSlug || null;
            }

            const payload = {
                name: formData.name,
                type: formData.type,
                expectedHarvestDays: formData.expectedHarvestDays ? parseInt(formData.expectedHarvestDays, 10) : null,
                location: formData.location || null,
                notes: formData.notes || null,
                bestSeason: formData.bestSeason || null,
                wateringFrequency: formData.wateringFrequency
                    ? String(Math.max(1, parseInt(formData.wateringFrequency, 10)))
                    : null,
                sunExposure: formData.sunExposure || null,
                cyclePhasesJson: formData.cyclePhasesJson ? JSON.parse(formData.cyclePhasesJson) : null,
                wateringQuantityMl: formData.wateringQuantityMl ? parseInt(formData.wateringQuantityMl, 10) : null,
                imageSlug,
            };

            const res = await api.post('/plant_templates', JSON.stringify(payload), {
                headers: {
                    'Content-Type': 'application/ld+json',
                    'Accept': 'application/ld+json',
                },
            });

            onPlantAdded(res.data);
            setSuccessMessage('Modèle de plante enregistré avec succès !');

            setTimeout(handleCloseModal, 1000);
        } catch (err) {
            console.error('Erreur lors de la création du modèle de plante:', err);
            const apiError = err.response?.data?.detail
                || err.response?.data?.violations?.[0]?.message
                || 'Une erreur est survenue lors de l\'enregistrement.';
            setError(apiError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={handleCloseModal} aria-labelledby="add-plant-title">
            <Box sx={addPlantStyles.modalBox}>

                {/* Header du Modal */}
                <Box sx={addPlantStyles.modalHeader}>
                    <LocalFlorist sx={{ fontSize: 36, color: PRIMARY_GREEN, mr: 1.5 }} />
                    <Typography
                        variant="h5"
                        component="h2"
                        id="add-plant-title"
                        sx={addPlantStyles.modalTitle}
                    >
                        Inventaire des Plantes
                    </Typography>
                    <IconButton onClick={handleCloseModal} sx={addPlantStyles.closeIcon}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Stepper - Indicateur de progression */}
                <Box sx={addPlantStyles.stepperContainer}>
                    <Box sx={addPlantStyles.stepItem}>
                        <Box sx={addPlantStyles.stepCircle(currentStep === 1, currentStep > 1)}>
                            {currentStep > 1 ? <CheckCircle sx={{ fontSize: 20 }} /> : '1'}
                        </Box>
                        <Typography sx={addPlantStyles.stepLabel(currentStep === 1)}>
                            Informations de base
                        </Typography>
                    </Box>

                    <Box sx={addPlantStyles.stepDivider} />

                    <Box sx={addPlantStyles.stepItem}>
                        <Box sx={addPlantStyles.stepCircle(currentStep === 2, false)}>
                            2
                        </Box>
                        <Typography sx={addPlantStyles.stepLabel(currentStep === 2)}>
                            Détails & Photo
                        </Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" icon={<InfoOutlined />} sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" icon={<AddCircleOutline />} sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                        {/* ÉTAPE 1 : Informations de base */}
                        {currentStep === 1 && (
                            <>
                                {/* Nom - Type */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Nom de la plante"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Grass sx={{ color: '#6c757d' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <FormControl size="small" required fullWidth sx={addPlantStyles.selectControl}>
                                            <InputLabel>Type</InputLabel>
                                            <Select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                label="Type"
                                                variant="outlined"
                                            >
                                                {plantTypes.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Grid>

                                {/* Jours estimés - Lieu */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <TextField
                                            fullWidth
                                            label="Jours estimés"
                                            name="expectedHarvestDays"
                                            type="number"
                                            value={formData.expectedHarvestDays}
                                            onChange={handleChange}
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarMonth sx={{ color: '#6c757d' }} />
                                                    </InputAdornment>
                                                ),
                                                inputProps: { min: 0 },
                                                endAdornment: <InputAdornment position="end">jours</InputAdornment>,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Lieu (Ex: Pot A, Jardin Nord)"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationOn sx={{ color: '#6c757d' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                {/* Meilleure saison */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <FormControl size="small" fullWidth sx={addPlantStyles.selectControl}>
                                            <InputLabel>Meilleure saison</InputLabel>
                                            <Select
                                                name="bestSeason"
                                                value={formData.bestSeason}
                                                onChange={handleChange}
                                                label="Meilleure saison"
                                                variant="outlined"
                                            >
                                                {bestSeasons.map((season) => (
                                                    <MenuItem key={season} value={season}>
                                                        {season}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Grid>

                                {/* Exposition au soleil */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <FormControl size="small" fullWidth sx={addPlantStyles.selectControl}>
                                            <InputLabel>Exposition au soleil</InputLabel>
                                            <Select
                                                name="sunExposure"
                                                value={formData.sunExposure}
                                                onChange={handleChange}
                                                label="Exposition au soleil"
                                                variant="outlined"
                                            >
                                                {sunExposures.map((exposure) => (
                                                    <MenuItem key={exposure} value={exposure}>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <WbSunny sx={{ fontSize: 18, color: '#ff9800' }} />
                                                            {exposure}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Grid>
                            </>
                        )}

                        {/* ÉTAPE 2 : Détails & Photo */}
                        {currentStep === 2 && (
                            <>

                                {/* Fréquence - Quantité */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <TextField
                                            fullWidth
                                            label="Fréquence d'arrosage (jours)"
                                            name="wateringFrequency"
                                            type="number"
                                            value={formData.wateringFrequency}
                                            onChange={handleChange}
                                            variant="outlined"
                                            size="small"
                                            placeholder="Nombre de jours entre deux arrosages"
                                            inputProps={{ min: 1, step: 1 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <WaterDrop sx={{ color: '#00bcd4' }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: <InputAdornment position="end">jours</InputAdornment>,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={addPlantStyles.formControl}>
                                        <TextField
                                            fullWidth
                                            label="Quantité d'arrosage (ml)"
                                            name="wateringQuantityMl"
                                            type="number"
                                            value={formData.wateringQuantityMl}
                                            onChange={handleChange}
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <WaterDrop sx={{ color: '#00bcd4' }} />
                                                    </InputAdornment>
                                                ),
                                                inputProps: { min: 0 },
                                                endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                {/* Notes et Image côte à côte sur desktop */}
                                <Grid item xs={12} md={6}>
                                    {/* Image */}
                                    <Box sx={addPlantStyles.imageUploadContainer}>
                                        <Box sx={addPlantStyles.imageUploadHeader}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                Photo de la plante
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                JPG, PNG ou WEBP
                                            </Typography>
                                        </Box>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="upload-image-button"
                                            type="file"
                                            onChange={handleImageChange}
                                        />
                                        <Box
                                            component="label"
                                            htmlFor="upload-image-button"
                                            sx={addPlantStyles.imageDropZone}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                        >
                                            <CloudUpload sx={{ fontSize: 40, color: PRIMARY_GREEN }} />
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {imageFile ? 'Remplacer l\'image' : 'Choisir une image'}
                                            </Typography>
                                            <Typography sx={addPlantStyles.imageHelperText}>
                                                {imageFile ? imageFile.name : 'PNG, JPG ou WEBP'}
                                            </Typography>
                                        </Box>

                                        {imagePreview && (
                                            <Box sx={addPlantStyles.imagePreviewWrapper}>
                                                <Box
                                                    component="img"
                                                    src={imagePreview}
                                                    alt="Aperçu"
                                                    sx={addPlantStyles.imagePreview}
                                                />
                                                <Box sx={addPlantStyles.imagePreviewOverlay}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleRemoveImage}
                                                        aria-label="Supprimer l'image"
                                                        sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
                                                    >
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    {/* Notes */}
                                    <Box sx={addPlantStyles.notesControl}>
                                        <TextField
                                            fullWidth
                                            label="Notes supplémentaires"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            multiline
                                            rows={12}
                                            variant="outlined"
                                        />
                                    </Box>
                                </Grid>
                            </>
                        )}
                    </Grid>

                    {/* Boutons de navigation */}
                    {currentStep === 1 ? (
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ ...addPlantStyles.nextButton, mt: 3 }}
                            disabled={!isStep1Valid()}
                            onClick={handleNext}
                            endIcon={<ArrowForward />}
                        >
                            Suivant
                        </Button>
                    ) : (
                        <Box sx={addPlantStyles.navigationButtons}>
                            <Button
                                variant="outlined"
                                sx={addPlantStyles.backButton}
                                onClick={handleBack}
                                startIcon={<ArrowBack />}
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={addPlantStyles.submitButton}
                                disabled={isSubmitting || successMessage}
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutline />}
                            >
                                {isSubmitting ? 'Ajout en cours...' : 'Enregistrer ma nouvelle plante'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}