import { alpha } from '@mui/material/styles';

export const notificationsStyles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
  },
  container: {
    py: { xs: 3, sm: 4, md: 5 },
    px: { xs: 2, sm: 3, md: 4 },
  },
  header: {
    mb: 4,
    textAlign: 'left',
  },
  title: {
    fontWeight: 800,
    color: '#1E293B',
    fontSize: { xs: '1.75rem', md: '2.25rem' },
    mb: 0,
  },
  subtitle: {
    color: '#64748B',
    fontSize: { xs: '0.875rem', md: '1rem' },
    maxWidth: '600px',
  },
  filtersContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    mb: 3,
  },
  toggleGroup: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  toggleButton: {
    textTransform: 'none',
    px: { xs: 2, sm: 3 },
    py: 1,
    fontSize: '0.875rem',
    border: 'none',
    '&.Mui-selected': {
      backgroundColor: '#0F172A',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#334155',
      },
    },
    '&:hover': {
      backgroundColor: '#F8FAFC',
    },
    transition: 'all 0.2s ease',
  },
  markAllButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: 'none',
    backgroundColor: '#0F172A',
    px: { xs: 2, sm: 3 },
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    '&:hover': {
      backgroundColor: '#334155',
      boxShadow: 'none',
    },
    '&:disabled': {
      backgroundColor: '#E2E8F0',
      color: '#94A3B8',
    },
  },
  card: (isRead) => ({
    borderRadius: '16px',
    backgroundColor: '#fff',
    border: '1px solid',
    borderColor: isRead ? '#F1F5F9' : '#E2E8F0',
    boxShadow: isRead
      ? 'none'
      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderColor: '#CBD5E1',
    },
    opacity: isRead ? 0.75 : 1,
  }),
  cardContent: {
    p: { xs: 2, sm: 3 },
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 1.5, sm: 2 },
    alignItems: 'flex-start',
    '&:last-child': {
      pb: { xs: 2, sm: 3 },
    },
  },
  iconBox: (color) => ({
    flexShrink: 0,
    width: { xs: 40, sm: 48 },
    height: { xs: 40, sm: 48 },
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color, 0.1),
    color: color,
    '& svg': {
      fontSize: { xs: '1.25rem', sm: '1.5rem' },
    },
  }),
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 0.5, sm: 1 },
    mb: 1,
  },
  cardTitle: (isRead) => ({
    fontWeight: isRead ? 600 : 700,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    color: '#1E293B',
    lineHeight: 1.4,
  }),
  date: {
    fontSize: { xs: '0.7rem', sm: '0.75rem' },
    color: '#94A3B8',
    whiteSpace: { xs: 'normal', sm: 'nowrap' },
  },
  message: {
    color: '#475569',
    fontSize: { xs: '0.875rem', sm: '0.925rem' },
    lineHeight: 1.6,
    mb: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    mt: 0,
  },
  actionButton: {
    textTransform: 'none',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
    fontWeight: 600,
    borderRadius: '8px',
    py: 0.5,
    px: { xs: 1.5, sm: 2 },
  },
  emptyState: {
    textAlign: 'center',
    py: { xs: 6, sm: 8 },
    px: 2,
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px dashed #E2E8F0',
  },
  emptyIcon: {
    width: { xs: 64, sm: 80 },
    height: { xs: 64, sm: 80 },
    borderRadius: '50%',
    bgcolor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    mt: 4,
  },
  pagination: {
    '& .MuiPaginationItem-root': {
      borderRadius: '8px',
      fontWeight: 600,
      '&.Mui-selected': {
        backgroundColor: '#0F172A',
        color: '#fff',
        '&:hover': {
          backgroundColor: '#334155',
        },
      },
    },
  },
};
