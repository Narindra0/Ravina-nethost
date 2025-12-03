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
  Divider,
} from '@mui/material'
import { Star, Redeem, CheckCircle } from '@mui/icons-material'
import axios from '../../lib/axios'

const AccountModal = ({ open, onClose, user }) => {
  const [status, setStatus] = useState('FREE')
  const [expiryDate, setExpiryDate] = useState(null)
  const [activationCode, setActivationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)

  // Charger le statut du compte à l'ouverture de la modal
  useEffect(() => {
    if (open) {
      fetchAccountStatus()
    }
  }, [open])

  const fetchAccountStatus = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/account/status')
      setStatus(response.data.status)
      setExpiryDate(response.data.expiryDate)
      setLoading(false)
    } catch (err) {
      console.error('Erreur lors de la récupération du statut:', err)
      setLoading(false)
    }
  }

  const handleActivateCode = async () => {
    if (!activationCode.trim()) {
      setError('Veuillez entrer un code d\'activation')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await axios.post('/api/account/activate', {
        code: activationCode.trim(),
      })

      if (response.data.success) {
        setSuccess(response.data.message)
        setStatus('PREMIUM')
        setExpiryDate(response.data.expiryDate)
        setActivationCode('')
        setShowCodeInput(false)
        
        // Recharger la page après 2 secondes pour mettre à jour le UI
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
      setLoading(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Erreur lors de l\'activation du code'
      )
      setLoading(false)
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: isPremium
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {isPremium ? <Star /> : <Redeem />}
        Mon Compte
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading && !status ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Affichage du statut actuel */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Statut actuel
              </Typography>
              <Chip
                label={isPremium ? 'Premium' : 'Gratuit'}
                color={isPremium ? 'secondary' : 'default'}
                icon={isPremium ? <CheckCircle /> : null}
                sx={{
                  fontSize: '1rem',
                  py: 2.5,
                  px: 1,
                  fontWeight: 700,
                }}
              />
            </Box>

            {isPremium && expiryDate && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Votre accès Premium expire le{' '}
                  <strong>{formatExpiryDate(expiryDate)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getDaysRemaining(expiryDate)} jour(s) restant(s)
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Section d'activation du code */}
            {!showCodeInput && !isPremium && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Passez à Premium pour accéder à des données botaniques
                  enrichies via Trefle.io
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Star />}
                  onClick={() => setShowCodeInput(true)}
                  sx={{ mt: 2 }}
                >
                  Activer Premium
                </Button>
              </Box>
            )}

            {!showCodeInput && isPremium && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vous avez un nouveau code ? Prolongez votre accès Premium
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setShowCodeInput(true)}
                  sx={{ mt: 2 }}
                >
                  Prolonger l'accès
                </Button>
              </Box>
            )}

            {showCodeInput && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Code d'activation
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ex: RAVINA2025"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  sx={{ mb: 2 }}
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowCodeInput(false)
                      setActivationCode('')
                      setError('')
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleActivateCode}
                    disabled={loading || !activationCode.trim()}
                    fullWidth
                  >
                    {loading ? 'Activation...' : 'Activer'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AccountModal