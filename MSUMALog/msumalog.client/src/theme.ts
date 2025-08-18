import { createTheme, responsiveFontSizes, alpha } from '@mui/material/styles';

const primaryMain = '#2F80ED';
const primaryLight = '#64A9F6';
const primaryDark = '#1B5CB4';
const grayBg = '#f3f5f7';
const grayPaper = '#ffffff';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      light: primaryLight,
      dark: primaryDark,
      contrastText: '#fff'
    },
    secondary: {
      main: '#1565c0'
    },
    error: {
      main: '#f44336', // สีแดงสำหรับ error
      light: '#e57373',
      dark: '#d32f2f',
      contrastText: '#fff'
    },
    background: {
      default: grayBg,
      paper: grayPaper
    },
    divider: alpha(primaryMain, 0.15)
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: `'Sarabun','Roboto','Helvetica','Arial',sans-serif`,
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(circle at 20% 15%, ${alpha(primaryLight,0.15)}, ${grayBg})`,
          minHeight: '100vh'
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width:600px)': {
            paddingLeft: '24px',
            paddingRight: '24px'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg,#ffffff 0%,#fcfdff 60%,#f6f8fa 100%)',
          border: '1px solid ' + alpha(primaryMain, 0.08),
          padding: '16px',
          '@media (min-width:600px)': { padding: '24px' }
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        dense: {
          minHeight: 44,
          '@media (min-width:600px)': { minHeight: 48 }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(90deg, ${primaryDark}, ${primaryMain})`
        }
      }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;