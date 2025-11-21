import React, { useEffect, useState } from 'react'
import { api } from '../lib/axios'
import { authStore } from '../store/auth'
import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material'

export default function Plants() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await api.get('/plants')
        console.log('Réponse API:', res.data)

        if (Array.isArray(res.data)) {
          setPlants(res.data)
        } else if (res.data['hydra:member']) {
          setPlants(res.data['hydra:member'])
        } else {
          setPlants([]) // fallback
        }
      } catch (err) {
        console.error(err)
        setError('Erreur lors du chargement des plantes')
      } finally {
        setLoading(false)
      }
    }

    fetchPlants()
  }, [])

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        🌿 Mes Plantes
      </Typography>

      {loading ? (
        <Typography>Chargement...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : plants.length === 0 ? (
        <Typography>Aucune plante enregistrée.</Typography>
      ) : (
        <Grid container spacing={2}>
          {plants.map((plant) => (
            <Grid item xs={12} sm={6} md={4} key={plant.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6">{plant.name}</Typography>
                  <Typography variant="body2">🌱 Type : {plant.type}</Typography>
                  <Typography variant="body2">📅 Plantée le : {new Date(plant.plantedAt).toLocaleDateString()}</Typography>
                  <Typography variant="body2">⏳ Récolte : {plant.expectedHarvestDays} jours</Typography>
                  <Typography variant="body2">📍 Lieu : {plant.location}</Typography>
                  {plant.notes && <Typography variant="body2">📝 {plant.notes}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Button variant="contained" color="success" sx={{ mt: 3 }}>
        ➕ Ajouter une plante
      </Button>
    </Box>
  )
}
