import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material'
import { Close, LocalFlorist, MyLocation, CalendarMonth } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { api } from '../lib/axios'

export default function CreateUserPlantationModal({ open, onClose, onCreated, initialTemplateId }) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    plantTemplate: '',
    localisation: '',
    geolocalisationLat: '',
    geolocalisationLon: '',
    datePlantation: todayIso,
  })

  const locationSuggestions = ['Intérieur', 'Extérieur', 'Balcon', 'Jardin', 'Serre', 'Terrasse', 'Fenêtre Sud']

  useEffect(() => {
    if (!open) return
    const fetchTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const res = await api.get('/plant_templates', { params: { itemsPerPage: 100 } })
        const payload = res.data
        const list = Array.isArray(payload) ? payload : (payload['hydra:member'] || payload['member'] || [])
        setTemplates(list)
      } catch (e) {
        setError("Impossible de charger les modèles de plante.")
      } finally {
        setLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [open])

  // Pré-sélectionner le template si fourni
  useEffect(() => {
    if (open && initialTemplateId) {
      setForm((prev) => ({ ...prev, plantTemplate: initialTemplateId }))
    }
  }, [open, initialTemplateId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const fillGeolocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          geolocalisationLat: String(pos.coords.latitude.toFixed(6)),
          geolocalisationLon: String(pos.coords.longitude.toFixed(6)),
        }))
      },
      () => setError("Impossible de récupérer la position actuelle.")
    )
  }

  const validate = () => {
    if (!form.plantTemplate) {
      setError('Veuillez sélectionner un modèle de plante.')
      return false
    }
    if (!form.localisation.trim()) {
      setError('Veuillez renseigner la localisation.')
      return false
    }
    const lat = parseFloat(form.geolocalisationLat)
    const lon = parseFloat(form.geolocalisationLon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError('Veuillez saisir des coordonnées valides (latitude et longitude).')
      return false
    }
    if (!form.datePlantation) {
      setError('Veuillez choisir une date de plantation.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        plantTemplate: `/api/plant_templates/${form.plantTemplate}`,
        localisation: form.localisation,
        geolocalisationLat: parseFloat(form.geolocalisationLat),
        geolocalisationLon: parseFloat(form.geolocalisationLon),
        datePlantation: form.datePlantation,
      }
      const res = await api.post('/plantations', payload, {
        headers: {
          'Content-Type': 'application/ld+json',
          'Accept': 'application/ld+json',
        },
      })
      onCreated?.(res.data)
    } catch (err) {
      const apiErr = err?.response?.data?.detail || 'Erreur lors de la création de la plantation.'
      setError(apiErr)
    } finally {
      setSubmitting(false)
    }
  }

  const resetAndClose = () => {
    setForm({
      plantTemplate: '',
      localisation: '',
      geolocalisationLat: '',
      geolocalisationLon: '',
      datePlantation: todayIso,
    })
    setError('')
    onClose?.()
  }

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isXs}
      PaperProps={{ sx: { borderRadius: isXs ? 0 : 3 } }}
    >
      <DialogTitle sx={{ pr: 7, py: isXs ? 1.5 : 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalFlorist sx={{ color: '#10b981' }} />
            <Typography variant={isXs ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700 }}>
              Nouvelle plantation
            </Typography>
          </Box>
          <IconButton onClick={resetAndClose} aria-label="close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: isXs ? 1 : 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth size="small" required>
            <InputLabel id="template-label">Nom du plante</InputLabel>
            <Select
              labelId="template-label"
              name="plantTemplate"
              label="Nom du plante"
              value={form.plantTemplate}
              onChange={handleChange}
            >
              {loadingTemplates ? (
                <MenuItem disabled>
                  <CircularProgress size={18} sx={{ mr: 1 }} /> Chargement…
                </MenuItem>
              ) : (
                templates.map((tpl) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Autocomplete
            freeSolo
            options={locationSuggestions}
            value={form.localisation}
            onInputChange={(_, newValue) => setForm((prev) => ({ ...prev, localisation: newValue || '' }))}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Localisation (ex: Intérieur, Extérieur, Balcon)"
                required
                fullWidth
              />
            )}
          />

          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              size="small"
              label="Latitude"
              name="geolocalisationLat"
              value={form.geolocalisationLat}
              onChange={handleChange}
              required
              type="number"
              fullWidth
              sx={{ flex: '1 1 180px' }}
            />
            <TextField
              size="small"
              label="Longitude"
              name="geolocalisationLon"
              value={form.geolocalisationLon}
              onChange={handleChange}
              required
              type="number"
              fullWidth
              sx={{ flex: '1 1 180px' }}
            />
            <Button
              onClick={fillGeolocation}
              variant="outlined"
              size="small"
              startIcon={<MyLocation />}
              sx={{
                ml: 'auto',
                whiteSpace: 'nowrap',
                borderColor: '#10b981',
                color: '#10b981',
                ':hover': { borderColor: '#059669', backgroundColor: 'rgba(16,185,129,0.06)' },
                flex: { xs: '1 1 100%', sm: '0 0 auto' },
              }}
            >
              Ma position
            </Button>
          </Box>

          <TextField
            size="small"
            type="date"
            label="Date de plantation"
            name="datePlantation"
            value={form.datePlantation}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            InputProps={{ startAdornment: <CalendarMonth sx={{ color: '#6b7280', mr: 1 }} /> }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={resetAndClose} disabled={submitting}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
        >
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  )
}


