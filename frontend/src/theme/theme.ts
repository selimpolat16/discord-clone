import { createTheme } from '@mui/material';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5865F2', // Discord'un primary rengi
    },
    background: {
      default: '#202225', // Discord'un arka plan rengi
      paper: '#2F3136', // Discord'un secondary arka plan rengi
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B9BBBE',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Butonlardaki otomatik büyük harfi kaldır
        },
      },
    },
  },
}); 