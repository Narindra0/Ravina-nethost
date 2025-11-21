import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import Sidebar from './Sidebar';
import { LocalFlorist, WaterDrop, LocationOn, Menu as MenuIcon, AddCircleOutline, Home, Park } from '@mui/icons-material';
import { IconButton, Box, Button } from '@mui/material';
import '../styles/Plantations.styles.css';
import PlantationDetailsModal from './PlantationDetailsModal';
import CreateUserPlantationModal from './CreateUserPlantationModal';

const getPlantImagePath = (imageSlug) => {
  // imageSlug contient maintenant l'URL Cloudinary complète
  return imageSlug || '/images/plantes/default.jpg';
};

const getStatusColor = (status) => {
  const statusMap = {
    'ACTIVE': '#10b981',
    'HARVESTED': '#f59e0b',
    'ARCHIVED': '#6b7280',
    'PAUSED': '#ef4444',
  };
  return statusMap[status] || '#10b981';
};

const getStatusLabel = (status) => {
  const labelMap = {
    'ACTIVE': 'Active',
    'HARVESTED': 'Récoltée',
    'ARCHIVED': 'Archivée',
    'PAUSED': 'En pause',
  };
  return labelMap[status] || status;
};

const getCurrentStage = (cyclePhasesJson, progression) => {
  if (!cyclePhasesJson || typeof cyclePhasesJson !== 'object') {
    // Fallback si pas de phases définies
    if (progression < 15) return 'Germination';
    if (progression < 45) return 'Croissance';
    if (progression < 75) return 'Floraison';
    if (progression < 95) return 'Maturation';
    return 'Récolte';
  }

  // Convertir l'objet en tableau trié par seuil
  const phases = Object.entries(cyclePhasesJson)
    .map(([key, value]) => {
      // Support de différents formats : "0-30" ou {start_percentage: 0, name: "..."}
      let startPercent = null;
      let stageName = null;

      if (typeof value === 'object' && value !== null) {
        stageName = value.stade || value.name || value.stage || key;
        startPercent = value.start_percentage || value.startPercentage ||
          (key.includes('-') ? parseFloat(key.split('-')[0]) : null);
      } else if (typeof value === 'string') {
        stageName = value;
        // Essayer d'extraire le pourcentage de la clé si format "0-30"
        if (key.includes('-')) {
          startPercent = parseFloat(key.split('-')[0]);
        }
      } else {
        stageName = key;
      }

      return {
        startPercent: startPercent ?? 0,
        name: stageName,
        key,
      };
    })
    .sort((a, b) => (a.startPercent ?? 0) - (b.startPercent ?? 0));

  // Trouver le stade actuel basé sur le pourcentage
  let currentStage = phases[0]?.name || 'Germination';

  for (let i = phases.length - 1; i >= 0; i--) {
    if (progression >= (phases[i].startPercent ?? 0)) {
      currentStage = phases[i].name;
      break;
    }
  }

  return currentStage;
};

export default function Plantations() {
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleSidebarMobile = () => {
    setIsSidebarMobileOpen((v) => !v);
  };

  const daysUntil = (dateString) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const today = new Date();
    // Normaliser à minuit pour éviter les décalages horaires
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffMs = t1 - t0;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const isPlantationFuture = (datePlantation) => {
    if (!datePlantation) return false;
    const plantDate = new Date(datePlantation);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    plantDate.setHours(0, 0, 0, 0);
    return plantDate > today;
  };

  const daysUntilPlantation = (datePlantation) => {
    if (!datePlantation) return 0;
    const plantDate = new Date(datePlantation);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    plantDate.setHours(0, 0, 0, 0);
    const diffMs = plantDate - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const isIndoorLocation = (location) => {
    if (!location) return false;
    const indoor = ['balcon', 'pot', 'intérieur', 'interieur', 'maison', 'appartement', 'terrasse', 'véranda', 'veranda'];
    return indoor.some(keyword => location.toLowerCase().includes(keyword));
  };

  const handlePlantationAdded = (newPlantation) => {
    if (!newPlantation) return;
    setPlantations((prev) => [newPlantation, ...prev]);
    setShowAddModal(false);
  };

  useEffect(() => {
    async function fetchPlantations() {
      try {
        const response = await api.get('/plantations', {
          headers: {
            Accept: 'application/ld+json',
          },
        });
        const payload = response.data;

        const plantationsList = Array.isArray(payload)
          ? payload
          : payload?.['hydra:member'] ?? payload?.member ?? payload ?? [];

        setPlantations(Array.isArray(plantationsList) ? plantationsList : []);
      } catch (err) {
        console.error('Error fetching plantations:', err);
        setError("Impossible de charger vos plantations.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlantations();
    // Expose for later refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    window.__refreshPlantations = fetchPlantations;
  }, []);

  return (
    <div className="plantations-page">
      {/* Bouton menu mobile */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1200,
        }}
      >
        <IconButton
          color="primary"
          aria-label="open drawer"
          onClick={toggleSidebarMobile}
          sx={{ backgroundColor: 'white', boxShadow: 3 }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Sidebar isMobileOpen={isSidebarMobileOpen} onClose={toggleSidebarMobile} />
      <main className="plantations-content">
        <header className="plantations-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>Mes Plantations</h1>
            <Button
              variant="contained"
              startIcon={<AddCircleOutline />}
              onClick={() => setShowAddModal(true)}
              sx={{
                backgroundColor: '#10b981',
                ':hover': { backgroundColor: '#059669' },
                borderRadius: '10px',
                minWidth: { xs: 40, md: 120 },
                px: { xs: 1.25, md: 2 },
              }}
            >
              <span style={{ display: 'none' }} className="btn-text-xs">.</span>
              <span className="btn-text-md" style={{ display: 'none' }}>Planter</span>
            </Button>
          </div>
        </header>

        {loading && (
          <div className="loading-container">
            <p>Chargement…</p>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}

        <section className="plantations-list">
          {plantations.map((plantation) => {
            const template = plantation.plantTemplate;
            const snapshot = plantation.suiviSnapshots?.[0];
            const decisionDetails = snapshot?.decisionDetailsJson ?? {};
            const adviceCards = Array.isArray(decisionDetails.cards) ? decisionDetails.cards : [];
            const firstAdviceCard = adviceCards[0];
            const hasAdviceSnippet = Boolean(firstAdviceCard?.message);
            const progression = snapshot ? parseFloat(snapshot.progressionPourcentage) : 0;
            const isFuture = isPlantationFuture(plantation.datePlantation);
            const daysRemaining = isFuture ? daysUntilPlantation(plantation.datePlantation) : 0;
            const statusColor = isFuture ? '#f59e0b' : getStatusColor(plantation.etatActuel);
            const statusLabel = getStatusLabel(plantation.etatActuel);
            const plantImage = getPlantImagePath(template?.imageSlug);
            const currentStage = getCurrentStage(template?.cyclePhasesJson, progression);

            return (
              <article
                key={plantation['@id'] ?? plantation.id ?? Math.random()}
                className="plantation-card"
              >
                <div className="plantation-card-top">
                  <div className="plantation-image-container">
                    <img
                      src={plantImage}
                      alt={template?.name ?? 'Plantation'}
                      className="plantation-image"
                      onError={(e) => {
                        e.target.src = '/images/plantes/default.jpg';
                      }}
                    />
                  </div>
                  <div className="plantation-header-info">
                    <div className="plantation-title-row">
                      <h2 className="plantation-name">
                        {template?.name ?? 'Plantation'}
                      </h2>
                      <span
                        className="plantation-status-badge"
                        style={{ backgroundColor: statusColor }}
                      >
                        <LocalFlorist className="status-icon" />
                        {isFuture ? 'En attente' : statusLabel}
                      </span>
                    </div>
                    {template?.type && (
                      <p className="plantation-type">Type : {template.type}</p>
                    )}
                  </div>
                </div>

                {isFuture ? (
                  <div className="plantation-future-message">
                    <LocalFlorist className="plantation-future-message-icon" />
                    <p className="plantation-future-message-text">
                      {daysRemaining === 1
                        ? "Votre plantation est prévue pour demain !"
                        : `Votre plantation est prévue dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                      }
                    </p>
                    {daysRemaining === 1 && (
                      <p className="plantation-future-tip">
                        {isIndoorLocation(plantation.localisation)
                          ? "💡 Drainez le pot : Préparez votre nouveau pot en vous assurant qu'il a un bon drainage (trous, billes d'argile) pour éviter l'excès d'eau."
                          : "💡 Préparez le sol : Ameublissez et nettoyez les emplacements de plantation. Arrosez légèrement si le sol est très sec."
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  snapshot && (
                    <>
                      <div className="plantation-growth-section">
                        <div className="stage-label-top">
                          {snapshot.stadeActuel ?? currentStage}
                        </div>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, Math.max(0, progression))}%` }}
                          >
                            <span className="progress-bar-label"></span>
                          </div>
                          <span className="progress-bar-percentage">{Math.round(progression)}%</span>
                        </div>
                      </div>

                      <div className="plantation-watering-section">
                        <WaterDrop className="watering-icon" />
                        <div className="watering-texts">
                          {hasAdviceSnippet ? (
                            <>
                              <span className={`advice-pill advice-${(firstAdviceCard?.severity || 'info').toLowerCase()}`}>
                                {(() => {
                                  switch (firstAdviceCard?.type) {
                                    case 'watering_auto':
                                      return 'Arrosage validé';
                                    case 'cold_alert':
                                      return 'Alerte froid';
                                    case 'heat_alert':
                                      return 'Alerte chaleur';
                                    default:
                                      return 'Conseil';
                                  }
                                })()}
                              </span>
                              <p className="watering-text advice-snippet">
                                {firstAdviceCard?.message}
                              </p>
                            </>
                          ) : (
                            <p className="watering-text">
                              {(() => {
                                const d = daysUntil(snapshot.arrosageRecoDate);
                                if (d === null || Number.isNaN(d)) {
                                  return 'Date d’arrosage à venir';
                                }
                                if (d === 0) {
                                  return "Aujourd'hui";
                                }
                                if (d === 1) {
                                  return "Dans 1 jour";
                                }
                                return `Dans ${d} jours`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )
                )}

                <div className="plantation-footer">
                  {isIndoorLocation(plantation.localisation) ? (
                    <Home className="location-icon" />
                  ) : (
                    <Park className="location-icon" />
                  )}
                  <span className="plantation-location-text">{plantation.localisation}</span>
                </div>

                {!isFuture && (
                  <button
                    className="plantation-details-button"
                    onClick={() => setSelectedPlantation(plantation)}
                  >
                    Détails
                  </button>
                )}
              </article>
            );
          })}

          {plantations.length === 0 && !loading && !error && (
            <div className="empty-state">
              <p>Vous n'avez pas encore créé de plantation.</p>
            </div>
          )}
        </section>
      </main>

      <PlantationDetailsModal
        open={!!selectedPlantation}
        onClose={(result) => {
          setSelectedPlantation(null);
          if (result?.deletedId) {
            setPlantations((prev) => prev.filter(p => p.id !== result.deletedId));
            return;
          }
          if (typeof window.__refreshPlantations === 'function') {
            window.__refreshPlantations();
          }
        }}
        plantation={selectedPlantation}
      />

      <CreateUserPlantationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handlePlantationAdded}
      />
    </div>
  );
}
