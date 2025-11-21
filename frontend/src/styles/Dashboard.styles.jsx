// Dashboard.styles.jsx

export const PRIMARY_GREEN = '#10b981';
export const DARK_GREEN = '#059669';
export const LIGHT_GREEN = '#34d399';
export const BACKGROUND_COLOR = '#f9fafb';
export const ACCENT_ORANGE = '#f97316';

export const dashboardStyles = {
  // --- Root Layout ---
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: BACKGROUND_COLOR,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // --- Loading ---
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: BACKGROUND_COLOR,
  },

  // --- Main Content ---
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: BACKGROUND_COLOR,
  },

  container: {
    py: { xs: 3, sm: 5, md: 6 },
    px: { xs: 2, sm: 4, md: 6 },
  },

  // --- Header Section ---
  headerSection: {
    mb: 6,
  },

  welcomeTitle: {
    fontWeight: 700,
    color: '#111827',
    mb: 1,
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    letterSpacing: '-0.025em',
  },

  welcomeSubtitle: {
    color: '#6b7280',
    fontWeight: 400,
    fontSize: { xs: '1.1rem', sm: '1.25rem' },
  },

  // --- Feature Banner ---
  featureBanner: {
    position: 'relative',
    height: { xs: 220, sm: 260 },
    borderRadius: 4,
    mb: 6,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  featureBannerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },

  featureBannerPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    opacity: 0.4,
    zIndex: 1,
  },

  featureBannerContent: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    px: { xs: 3, sm: 6 },
  },

  featureBannerTitle: {
    color: 'white',
    fontWeight: 700,
    mb: 2,
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
  },

  featureBannerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    mb: 4,
    maxWidth: 500,
    fontSize: { xs: '1rem', sm: '1.1rem' },
  },

  featureBannerButton: {
    backgroundColor: 'white',
    color: PRIMARY_GREEN,
    px: 5,
    py: 1.5,
    borderRadius: 2,
    fontWeight: 600,
    fontSize: '1rem',
    width: 'fit-content',
    textTransform: 'none',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: '#f9fafb',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    transition: 'all 0.2s ease',
  },

  // --- Section Containers ---
  sectionContainer: {
    mb: 6,
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4,
    flexWrap: 'wrap',
    gap: 2,
  },

  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },

  sectionIcon: {
    fontSize: 28,
    color: '#6b7280',
  },

  sectionTitle: {
    fontWeight: 700,
    color: '#111827',
    fontSize: { xs: '1.5rem', sm: '1.75rem' },
  },

  sectionSubtitle: {
    color: '#6b7280',
    fontWeight: 500,
    mt: 0.5,
  },

  viewAllButton: {
    color: PRIMARY_GREEN,
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
  },

  // --- Suggestion Cards ---
  suggestionCard: {
    borderRadius: 3,
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-4px)',
    },
  },

  suggestionCardImage: {
    width: '100%',
    aspectRatio: '5 / 4',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px 12px 0 0',
  },

  suggestionCardTitle: {
    fontWeight: 600,
    color: '#111827',
    mb: 1,
  },

  suggestionCardType: {
    color: '#6b7280',
    mb: 2,
    fontSize: '0.875rem',
  },

  suggestionCardInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },

  suggestionCardInfoText: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },

  // --- Plant Cards ---
  plantCard: {
    borderRadius: 3,
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-6px)',
    },
  },

  plantCardImage: {
    width: '100%',
    aspectRatio: '5 / 4',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px 12px 0 0',
    '@media (min-width:900px)': {
      maxWidth: 220,
      margin: '0 auto',
    },
    // Responsive image sizing: full width on small screens, constrained on md+
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
  },

  plantCardTitle: {
    fontWeight: 700,
    color: '#111827',
    mb: 2,
    fontSize: '1.25rem',
  },

  plantNameLink: {
    padding: 0,
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#111827',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  plantCardBadge: {
    display: 'inline-block',
    px: 2,
    py: 0.5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: PRIMARY_GREEN,
    fontSize: '0.75rem',
    fontWeight: 600,
    mb: 3,
  },

  plantCardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
  },

  plantCardDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: '#6b7280',
    fontSize: '0.875rem',
  },

  // --- Add Plant Button ---
  addButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: { xs: 1.5, sm: 2.5 },
    mt: 6,
  },

  addPlantButton: {
    background: `linear-gradient(135deg, ${PRIMARY_GREEN} 0%, ${LIGHT_GREEN} 100%)`,
    color: 'white',
    px: { xs: 1.75, sm: 4 },
    py: { xs: 1, sm: 1.25 },
    minWidth: { xs: 48, sm: 'auto' },
    fontSize: '1rem',
    fontWeight: 700,
    textTransform: 'none',
    borderRadius: 2,
    boxShadow: '0 6px 12px -3px rgba(16, 185, 129, 0.25)',
    '&:hover': {
      background: `linear-gradient(135deg, ${DARK_GREEN} 0%, ${PRIMARY_GREEN} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: '0 14px 20px -5px rgba(16, 185, 129, 0.35)',
    },
    transition: 'all 0.3s ease',
  },

  // Ensure suggestion/plant cards action section has consistent padding and full-width button
  cardActions: {
    px: 2,
    pb: 2,
    pt: 0,
    '& > *': {
      width: '100%',
    },
  },

  // --- Empty State ---
  emptyState: {
    textAlign: 'center',
    py: 8,
    color: '#6b7280',
  },

  // --- Modal Styles ---

};