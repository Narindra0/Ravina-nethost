import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // vert nature 🌿
    },
    secondary: {
      main: '#81c784', // vert clair
    },
    background: {
      default: '#f9fbe7',
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
  },
});

export default theme;
