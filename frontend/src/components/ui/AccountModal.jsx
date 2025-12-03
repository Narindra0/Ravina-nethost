import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import { Star, Redeem, CheckCircle } from '@mui/icons-material'
import { api } from '../../lib/axios'

const premiumBenefits = [
  {
    title: 'Conseils météo en continu',
    description: 'Recalcule des arrosages après chaque pluie validée.',
  },
  {
    title: 'Alertes critiques instantanées',
    description: 'Retards, suppressions et dangers météo signalés en priorité.',
  },
  {
    title: 'Données botaniques Trefle.io',
    description: 'Fiches enrichies pour chaque plante et cycle complet.',
  },
]

const freeLimitations = [
  '1 seul recalcul météo par jour',
  'Pas de sauvegarde Premium après J+10',
  'Pas d’alertes avancées en cas de suppression',
]

const AccountModal = ({ open, onClose }) => {
  const [status, setStatus] = useState('FREE')
  const [expiryDate, setExpiryDate] = useState(null)
  const [activationCode, setActivationCode] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAccountStatus()
    }
  }, [open])

  const fetchAccountStatus = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setStatusLoading(true)
      }
      const response = await api.get('/account/status')
      setStatus(response.data.status)
      setExpiryDate(response.data.expiryDate)
    } catch (err) {
      console.error('Erreur lors de la récupération du statut:', err)
    } finally {
      if (showSpinner) {
        setStatusLoading(false)
      }
    }
  }

  const handleActivateCode = async () => {
    if (!activationCode.trim()) {
      setError('Veuillez entrer un code d\'activation')
      return
    }

    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await api.post('/account/activate', {
        code: activationCode.trim(),
      })

      if (response.data.success) {
        setSuccess(response.data.message || 'Code activé avec succès.')
        setActivationCode('')
        setShowCodeInput(false)
        await fetchAccountStatus(false)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Erreur lors de l\'activation du code'
      )
    } finally {
      setActionLoading(false)
    }
  }

  const isPremium = status === 'PREMIUM'

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return 0
    const expiry = new Date(dateStr)
    const now = new Date()
    const diff = expiry - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const heroGradient = isPremium
    ? 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        Mon Compte
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {statusLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                background: heroGradient,
                color: '#fff',
                borderRadius: 3,
                p: { xs: 2.5, sm: 3.5 },
                mb: 3,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              <Chip
                icon={isPremium ? <CheckCircle /> : <Redeem />}
                label={isPremium ? 'Premium actif' : 'Compte gratuit'}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontWeight: 700,
                  mb: 1.5,
                  '& .MuiChip-icon': { color: '#fff' },
                  alignSelf: { xs: 'center', sm: 'flex-start' },
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: { xs: '1.1rem', sm: '1.4rem' },
                }}
              >
                {isPremium
                  ? 'Merci de soutenir Ravina 🌿'
                  : 'Libérez toutes le potentiels de RAVINA'}
              </Typography>
              {!isPremium && (
                <Typography
                  variant="subtitle2"
                  sx={{ fontStyle: 'italic', opacity: 0.8, mb: 1 }}
                >
                  Une expérience premium, pensée pour les jardiniers exigeants.
                </Typography>
              )}
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                {isPremium && expiryDate
                  ? `Accès garanti jusqu’au ${formatExpiryDate(expiryDate)} (${getDaysRemaining(expiryDate)} jour${getDaysRemaining(expiryDate) > 1 ? 's' : ''} restants).`
                  : 'Activez Premium pour débloquer les alertes pro et les données météo enrichies.'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 1.5, sm: 2 },
                mb: 3,
              }}
            >
              {premiumBenefits.map((benefit) => (
                <Box
                  key={benefit.title}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e5e7eb',
                    p: { xs: 2, sm: 2.5 },
                    backgroundColor: '#fff',
                    minHeight: { xs: 120, sm: 140 },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            {!isPremium && (
              <Box
                sx={{
                  borderRadius: 3,
                  border: '1px dashed #fca5a5',
                  p: 2.5,
                  mb: 3,
                  backgroundColor: '#fff7ed',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Limitations actuelles (compte gratuit)
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  {freeLimitations.map((item) => (
                    <Typography component="li" variant="body2" key={item}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                p: 3,
                backgroundColor: '#f8fafc',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {isPremium ? 'Prolonger Premium' : 'Activer un code Premium'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isPremium
                  ? 'Vous avez reçu un nouveau code ? Ajoutez-le pour prolonger votre accès sans interruption.'
                  : 'Déjà un code Premium en poche ? Entrez-le ci-dessous pour débloquer les fonctionnalités avancées.'}
              </Typography>

              {showCodeInput ? (
                <>
                  <TextField
                    fullWidth
                    placeholder="Ex : RAVINA2025"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    disabled={actionLoading}
                    sx={{ mb: 2 }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mb: 1.5 }}>
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert severity="success" sx={{ mb: 1.5 }}>
                      {success}
                    </Alert>
                  )}

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowCodeInput(false)
                        setActivationCode('')
                        setError('')
                        setSuccess('')
                      }}
                      disabled={actionLoading}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleActivateCode}
                      disabled={actionLoading || !activationCode.trim()}
                      fullWidth
                    >
                      {actionLoading ? 'Activation…' : 'Valider le code'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Button
                  variant={isPremium ? 'outlined' : 'contained'}
                  color="secondary"
                  startIcon={<Star />}
                  onClick={() => {
                    setShowCodeInput(true)
                    setError('')
                    setSuccess('')
                  }}
                >
                  {isPremium ? 'Ajouter un code' : 'Activer Premium'}
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AccountModal
