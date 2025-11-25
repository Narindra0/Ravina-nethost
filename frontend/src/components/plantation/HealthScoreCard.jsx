import React, { useEffect, useState } from 'react'
import { Box, Typography, LinearProgress, Alert, Skeleton } from '@mui/material'
import { Favorite, WaterDrop, TrendingUp, CalendarMonth } from '@mui/icons-material'
import { api } from '../../lib/axios'

const getScoreColor = (score) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 50) return '#f59e0b' // Yellow
    return '#ef4444' // Red
}

export default function HealthScoreCard({ plantation }) {
    const [scoreData, setScoreData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchScore = async () => {
            if (!plantation?.id) return

            setLoading(true)
            setError(null)
            try {
                const { data } = await api.get(`/plantations/${plantation.id}/health-score`)
                setScoreData(data)
            } catch (err) {
                console.error('Erreur score santé:', err)
                setError('Impossible de calculer le score de santé')
            } finally {
                setLoading(false)
            }
        }

        fetchScore()
    }, [plantation?.id])

    if (loading) {
        return (
            <Box sx={{ mb: 2 }}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
            </Alert>
        )
    }

    if (!scoreData) return null

    const { score, status, factors, recommendations } = scoreData
    const scoreColor = getScoreColor(score)

    return (
        <Box
            sx={{
                mb: 2,
                p: 2,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                backgroundColor: '#fafafa',
            }}
        >
            {/* Header with Score */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Favorite sx={{ color: scoreColor, fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Santé de la Plantation
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {status}
                    </Typography>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: scoreColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
                            {score}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Factors */}
            <Box display="flex" flexDirection="column" gap={1.5}>
                {/* Watering */}
                <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <WaterDrop sx={{ color: '#64748b', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, flex: 1 }}>
                            Arrosage
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                            {factors.watering}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={factors.watering}
                        sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: scoreColor,
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>

                {/* Growth */}
                <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <TrendingUp sx={{ color: '#64748b', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, flex: 1 }}>
                            Croissance
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                            {factors.growth}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={factors.growth}
                        sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: scoreColor,
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>

                {/* Age */}
                <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <CalendarMonth sx={{ color: '#64748b', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, flex: 1 }}>
                            Âge
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                            {factors.age}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={factors.age}
                        sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: scoreColor,
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>
            </Box>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && recommendations[0] !== 'Continuez ce bon travail ! Votre plantation est en excellente santé' && (
                <Box mt={2} pt={2} borderTop="1px solid #e5e7eb">
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        Recommandations
                    </Typography>
                    {recommendations.map((rec, idx) => (
                        <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                                color: '#64748b',
                                fontSize: '0.875rem',
                                mt: 0.5,
                            }}
                        >
                            • {rec}
                        </Typography>
                    ))}
                </Box>
            )}
        </Box>
    )
}
