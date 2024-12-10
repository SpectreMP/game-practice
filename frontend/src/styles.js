import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.variable, &.number': {
            backgroundColor: '#e6f3ff',
          },
          '&.print': {
            backgroundColor: '#e6ffe6',
          },
          '&.loop': {
            backgroundColor: '#fff0e6',
          },
        },
      },
    },
  },
});

export default theme;