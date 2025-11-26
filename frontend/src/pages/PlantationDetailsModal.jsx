import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  Alert,
} from '@mui/material'
import { Close, LocalFlorist, WaterDrop, LocationOn, Timeline, Visibility, VisibilityOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { api } from '../lib/axios'
import HealthScoreCard from '../components/plantation/HealthScoreCard'

const getStatusColor = (status) => {
  const statusMap = {
    'ACTIVE': '#10b981',
    'HARVESTED': '#f59e0b',
    'ARCHIVED': '#6b7280',
    'PAUSED': '#ef4444',
    'ATTENTE': '#3b82f6', // Blue for planned
  }
  return statusMap[status] || '#10b981'
}

const daysUntil = (dateString) => {
  if (!dateString) return null
  const target = new Date(dateString)
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffMs = t1 - t0
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

const mapCardSeverity = (severity) => {
  if (!severity) return 'info'
  const normalized = severity.toLowerCase()
  if (['warning', 'warn', 'alerte'].includes(normalized)) return 'warning'
  if (['danger', 'error'].includes(normalized)) return 'error'
  if (['success', 'ok'].includes(normalized)) return 'success'
  return 'info'
}

const getCardTitle = (type) => {
  switch (type) {
    case 'watering_auto':
      return 'Arrosage validé automatiquement'
    case 'cold_alert':
      return 'Alerte froid'
    case 'heat_alert':
      return 'Alerte chaleur'
    default:
      return 'Conseil'
  }
}

export default function PlantationDetailsModal({ open, onClose, plantation }) {
  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState('')
  const [showHistory, setShowHistory] = React.useState(false)

  const handleWater = async () => {
    if (!plantation?.id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/plantations/${plantation.id}/water`, {}, {
        headers: { Accept: 'application/ld+json' }
      })
      // On laisse le parent recharger la liste via onClose() + éventuel rafraîchissement
      onClose?.()
    } catch (e) {
      setActionError("Impossible d'enregistrer l'arrosage.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmPlantation = async () => {
    if (!plantation?.id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/plantations/${plantation.id}/confirm`, {}, {
        headers: { Accept: 'application/ld+json' }
      })
      onClose?.()
    } catch (e) {
      setActionError("Impossible de confirmer la plantation.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!plantation?.id) return
    if (!confirm('Supprimer cette plantation ? Cette action est irréversible.')) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.delete(`/plantations/${plantation.id}`, {
        headers: { Accept: 'application/ld+json' }
      })
      onClose?.({ deletedId: plantation.id })
    } catch (e) {
      setActionError('Suppression impossible.')
    } finally {
      setActionLoading(false)
    }
  }
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const snapshot = plantation?.suiviSnapshots?.[0]

  const hasWateredToday = React.useMemo(() => {
    if (!snapshot) return false

    const decisionDetails = snapshot.decisionDetailsJson ?? {}
    const isManual = decisionDetails.manual === true

    if (!isManual) return false

    const snapshotDate = new Date(snapshot.dateSnapshot)
    const today = new Date()

    const isSameDay =
      snapshotDate.getFullYear() === today.getFullYear() &&
      snapshotDate.getMonth() === today.getMonth() &&
      snapshotDate.getDate() === today.getDate()

    return isSameDay
  }, [snapshot])

  if (!plantation) return null
  const template = plantation.plantTemplate || {}
  const decisionDetails = snapshot?.decisionDetailsJson ?? {}
  const adviceCards = Array.isArray(decisionDetails.cards) ? decisionDetails.cards : []
  const autoValidation = decisionDetails.auto_validation
  const isAutoValidationToday =
    !!autoValidation &&
    autoValidation.reason === 'rain' &&
    (autoValidation.message || '').includes("Pluie prévue aujourd'hui")
  const progression = snapshot ? parseFloat(snapshot.progressionPourcentage) : 0
  const statusColor = getStatusColor(plantation.etatActuel)
  const d = snapshot ? daysUntil(snapshot.arrosageRecoDate) : null

  const isWateringTooFar = d !== null && d > 2
  const isPlanned = plantation.etatActuel === 'ATTENTE'

  const getDisabledMessage = () => {
    if (isPlanned) return null // Button is enabled for confirmation
    if (hasWateredToday) {
      return "Vous avez déjà arrosé cette plante aujourd'hui."
    }
    if (isAutoValidationToday) {
      return "Arrosage validé automatiquement aujourd'hui."
    }
    if (isWateringTooFar) {
      return `Arrosage prévu dans ${d} jour${d > 1 ? 's' : ''}. Trop tôt pour arroser maintenant.`
    }
    return null
  }

  const disabledMessage = getDisabledMessage()
  const shouldDisableButton = !!disabledMessage && !isPlanned

  const stage = snapshot?.stadeActuel
  const meteoToday = snapshot?.meteoDataJson?.daily?.[0]
  const lastSnapshots = (plantation.suiviSnapshots || []).slice(0, 3)

  const getPlannedMessage = () => {
    if (!plantation.datePlantation) return null
    const plannedDate = new Date(plantation.datePlantation)
    const today = new Date()
    // Reset hours to compare dates only
    plannedDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffTime = today - plannedDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Plantation prévue aujourd'hui."
    if (diffDays === 1) return "Plantation prévue hier."
    if (diffDays > 1) return `Plantation prévue il y a ${diffDays} jours.`
    return `Plantation prévue le ${plannedDate.toLocaleDateString('fr-FR')}.`
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isXs}
      PaperProps={{
        sx: { borderRadius: isXs ? 0 : 3 }
      }}
    >
      <DialogTitle sx={{ pr: 7, py: isXs ? 1.5 : 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" minWidth={0}>
            <LocalFlorist sx={{ color: statusColor }} />
            <Typography variant={isXs ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700 }}>
              {template?.name || 'Plantation'}{template?.type ? ` (${template.type})` : ''}
            </Typography>
          </Box>
          <Chip
            label={plantation.etatActuel === 'ATTENTE' ? 'EN ATTENTE' : plantation.etatActuel}
            sx={{
              bgcolor: statusColor,
              color: 'white',
              fontWeight: 700,
              height: isXs ? 26 : 28,
              fontSize: isXs ? '0.75rem' : '0.8rem'
            }}
          />
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          pt: isXs ? 1 : 2,
          maxHeight: isXs ? '100vh' : '70vh',
          overflowY: 'auto'
        }}
      >
        {actionError && (
          <Alert severity="error" sx={{ mb: 1 }}>{actionError}</Alert>
        )}
        {/* Localisation */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocationOn sx={{ color: '#ef4444' }} />
          <Typography variant="body2" color="text.secondary">
            {plantation.localisation}
          </Typography>
        </Box>

        {isPlanned ? (
          <Box mb={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {getPlannedMessage()}
              </Typography>
              <Typography variant="body2">
                Cliquez sur "J'ai planté" pour confirmer la plantation et démarrer le suivi.
              </Typography>
            </Alert>
          </Box>
        ) : (
          <>
            {/* Progression */}
            {snapshot && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stage || 'Stade'}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">{Math.round(progression)}%</Typography>
                </Box>
                <Box sx={{ width: '100%', height: 10, bgcolor: '#e5e7eb', borderRadius: 9999 }}>
                  <Box
                    sx={{
                      width: `${Math.min(100, Math.max(0, progression))}%`,
                      height: '100%',
                      bgcolor: '#10b981',
                      borderRadius: 9999,
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Arrosage */}
            {snapshot && (
              <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
                <WaterDrop sx={{ color: '#10b981', mt: '2px' }} />
                <Box>
                  <Typography variant={isXs ? 'body2' : 'body1'} sx={{ fontWeight: 600 }}>
                    {(() => {
                      const daysText = d === 0 ? "aujourd'hui" : d === 1 ? "1 jour" : `${d} jours`;
                      const dateText = new Date(snapshot.arrosageRecoDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      const quantityLiters = (parseFloat(snapshot.arrosageRecoQuantiteMl || 0) / 1000).toFixed(1);
                      const literText = parseFloat(quantityLiters) > 1 ? 'litres' : 'litre';

                      return `Le prochain arrosage est prévu dans ${daysText}, soit le ${dateText}, et nécessitera une quantité de ${quantityLiters} ${literText} d'eau.`;
                    })()}
                  </Typography>
                </Box>
              </Box>
            )}

            {adviceCards.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Conseils & alertes
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {adviceCards.map((card, index) => (
                    <Alert
                      key={`${card?.type ?? 'card'}-${index}`}
                      severity={mapCardSeverity(card?.severity)}
                      sx={{ borderRadius: 2 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {getCardTitle(card?.type)}
                      </Typography>
                      <Typography variant="body2">
                        {card?.message}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}

            {/* Meteo Today */}
            {meteoToday && (
              <Box mb={2} display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<Timeline />}
                  label={`Pluie: ${meteoToday.precipitation_sum ?? 0} mm`}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
                <Chip
                  label={`Max: ${meteoToday.temperature_max ?? '-'}°C`}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
                <Chip
                  label={`Min: ${meteoToday.temperature_min ?? '-'}°C`}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            )}

            {/* Health Score Section - Only show after 15 days from confirmation */}
            {(() => {
              if (!plantation.confirmationPlantation) return null;
              const confirmDate = new Date(plantation.confirmationPlantation);
              const today = new Date();
              const daysSinceConfirmation = Math.floor((today - confirmDate) / (1000 * 60 * 60 * 24));
              if (daysSinceConfirmation < 15) return null;
              return <HealthScoreCard plantation={plantation} />;
            })()}

            <Divider sx={{ my: 1.5 }} />

            {/* Historique récent */}
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Timeline sx={{ color: '#6b7280' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Historique</Typography>
                </Box>
                <IconButton size="small" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              {showHistory && (
                lastSnapshots.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Aucun snapshot récent.</Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {(() => {
                      const allSnapshots = plantation.suiviSnapshots || [];
                      const confirmDate = plantation.confirmationPlantation
                        ? new Date(plantation.confirmationPlantation).toISOString().split('T')[0]
                        : null;

                      // Create history events
                      const events = [];
                      let lastProgression = null;

                      allSnapshots.forEach((s, idx) => {
                        const snapshotDate = new Date(s.dateSnapshot).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        });
                        const snapshotDay = new Date(s.dateSnapshot).toISOString().split('T')[0];
                        const progression = Math.round(parseFloat(s.progressionPourcentage || '0'));
                        const details = s.decisionDetailsJson || {};

                        // Check if this is the confirmation day
                        if (confirmDate && snapshotDay === confirmDate && idx === allSnapshots.length - 1) {
                          events.push({
                            date: snapshotDate,
                            description: 'Jour de plantation',
                            type: 'plantation'
                          });
                          lastProgression = progression;
                          return;
                        }

                        // Check for manual watering
                        if (details.manual === true) {
                          events.push({
                            date: snapshotDate,
                            description: 'Arrosage manuel fait',
                            type: 'watering'
                          });
                        }

                        // Check for auto-cancelled watering (rain)
                        const autoVal = details.auto_validation;
                        if (autoVal && autoVal.reason === 'rain') {
                          const precipitationSum = s.meteoDataJson?.daily?.[0]?.precipitation_sum || 0;
                          if (precipitationSum > 10) {
                            events.push({
                              date: snapshotDate,
                              description: 'Arrosage annulé, forte pluie détectée',
                              type: 'rain_heavy'
                            });
                          } else {
                            events.push({
                              date: snapshotDate,
                              description: 'Pluie, arrosage annulé',
                              type: 'rain'
                            });
                          }
                        }

                        // Show progression only if it changed
                        if (lastProgression === null || progression !== lastProgression) {
                          events.push({
                            date: snapshotDate,
                            description: `${s.stadeActuel || 'Croissance'} ${progression}%`,
                            type: 'progression'
                          });
                          lastProgression = progression;
                        }
                      });

                      // Reverse to show most recent first, but limit to last 5 events
                      return events.slice(0, 5).map((event, idx) => (
                        <Box key={idx} display="flex" gap={1} alignItems="flex-start">
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px', flexShrink: 0 }}>
                            {event.date} :
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: event.type === 'plantation' ? 700 : 600 }}>
                            {event.description}
                          </Typography>
                        </Box>
                      ));
                    })()}
                  </Box>
                )
              )}
            </Box>
          </>
        )}

      </DialogContent>

      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5} gap={2} flexWrap="wrap">
        <Button
          onClick={handleDelete}
          color="error"
          variant="outlined"
          disabled={actionLoading}
        >
          Supprimer
        </Button>
        {shouldDisableButton ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              maxWidth: '60%',
              textAlign: 'right'
            }}
          >
            {disabledMessage}
          </Typography>
        ) : (
          <Button
            onClick={isPlanned ? handleConfirmPlantation : handleWater}
            variant="contained"
            disabled={actionLoading}
            sx={{ backgroundColor: isPlanned ? '#3b82f6' : '#10b981', ':hover': { backgroundColor: isPlanned ? '#2563eb' : '#059669' } }}
          >
            {actionLoading ? '...' : (isPlanned ? "J'ai planté" : "J'ai arrosé")}
          </Button>
        )}
      </Box>
    </Dialog>
  )
}


