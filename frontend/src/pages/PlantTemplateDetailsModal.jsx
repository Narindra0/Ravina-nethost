import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import {
  Close,
  WbSunny,
  Opacity,
  CalendarMonth,
  WaterDrop,
  AccessTime,
  Notes,
} from '@mui/icons-material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

const DEFAULT_PLANT_IMAGE = '/images/plantes/default.jpg'

const DetailTile = ({ icon, label, value }) => {
  if (!value) return null
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        height: '100%',
        maxWidth: 260,
        marginInline: 'auto',
        width: { xs: 340, sm: '100%' },
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          height: '100%',
        }}
      >
        {icon}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

const formatFrequency = (value) => {
  if (!value) return null
  const parsed = parseInt(value, 10)
  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed === 1 ? 'Tous les jours' : `Tous les ${parsed} jours`
  }
  return value
}

export default function PlantTemplateDetailsModal({ open, template, onClose }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, py: 2 }}>
        <Typography variant={fullScreen ? 'h6' : 'h5'} sx={{ fontWeight: 700 }}>
          Détails de la plante
        </Typography>
        <IconButton
          aria-label="Fermer"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
          backgroundColor: '#f9fafb',
        }}
      >
        {!template ? (
          <Typography color="text.secondary" textAlign="center">
            Aucune donnée à afficher.
          </Typography>
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#000',
              }}
            >
              <Box
                component="img"
                src={template.imageSlug ? `/images/plantes/${template.imageSlug}` : DEFAULT_PLANT_IMAGE}
                alt={template.name}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = DEFAULT_PLANT_IMAGE
                }}
                sx={{
                  width: '100%',
                  height: { xs: 220, md: 320 },
                  objectFit: 'cover',
                  opacity: 0.9,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 3,
                  color: 'white',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {template.name}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  {template.type || 'Type non renseigné'}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <DetailTile
                  icon={<CalendarMonth sx={{ color: '#10b981' }} />}
                  label="Récolte estimée"
                  value={
                    template.expectedHarvestDays
                      ? `${template.expectedHarvestDays} jours`
                      : null
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailTile
                  icon={<WaterDrop sx={{ color: '#0ea5e9' }} />}
                  label="Quantité d'arrosage"
                  value={
                    template.wateringQuantityMl
                      ? `${(template.wateringQuantityMl / 1000).toFixed(1)} L`
                      : null
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailTile
                  icon={<AccessTime sx={{ color: '#f97316' }} />}
                  label="Fréquence"
                  value={formatFrequency(template.wateringFrequency)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailTile
                  icon={<WbSunny sx={{ color: '#fbbf24' }} />}
                  label="Exposition"
                  value={template.sunExposure}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                p: 2.5,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1.5}>
                <Notes sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Notes et saison idéale
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Saison idéale : {template.bestSeason || 'Non renseignée'}
              </Typography>
              {template.notes ? (
                <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                  {template.notes}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune note disponible.
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}

