import React from 'react'
import {
  Box,
  Fade,
  IconButton,
  Modal,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
  mt: { xs: 2, md: 4 },
  px: 2,
  zIndex: 1400,
}

const cardStyle = {
  pointerEvents: 'auto',
  maxWidth: 420,
  width: '100%',
  borderRadius: 4,
  padding: 3,
  background: '#ffffff',
  color: '#333333',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  border: '1px solid rgba(0,0,0,0.1)',
}

export function NotificationToast({ notification, open, onClose }) {
  if (!notification) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ pointerEvents: 'none' }}
      BackdropProps={{ timeout: 300 }}
    >
      <Fade in={open} timeout={300}>
        <Box sx={modalStyle}>
          <Paper sx={cardStyle}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NotificationsActiveIcon color="action" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                  Nouvelle notification
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {notification.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {notification.message}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: '#333333',
                  opacity: 0.6,
                  '&:hover': { opacity: 1 },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        </Box>
      </Fade>
    </Modal>
  )
}
