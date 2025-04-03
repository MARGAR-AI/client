import { createTheme, alpha } from '@mui/material/styles';

// Define gradient colors
const gradients = {
  primary: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
  secondary: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)',
  success: 'linear-gradient(135deg, #2DCE89 0%, #2DCCA7 100%)',
  error: 'linear-gradient(135deg, #FF5252 0%, #FF7676 100%)',
  warning: 'linear-gradient(135deg, #FFB236 0%, #FFD86F 100%)',
  info: 'linear-gradient(135deg, #11CDEF 0%, #1171EF 100%)',
  dark: 'linear-gradient(135deg, #212529 0%, #343A40 100%)',
  light: 'linear-gradient(135deg, #EBEFF4 0%, #CED4DA 100%)',
};

// Define base colors
const colors = {
  primary: {
    main: '#4776E6',
    light: '#6C8FEA',
    dark: '#3A5FC8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8E54E9',
    light: '#A47BEE',
    dark: '#7A3DD0',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#2DCE89',
    light: '#4FD8A0',
    dark: '#26B977',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#FF5252',
    light: '#FF7676',
    dark: '#E04848',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FFB236',
    light: '#FFC25F',
    dark: '#E09A2E',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#11CDEF',
    light: '#41D7F2',
    dark: '#0FB5D3',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8F9FE',
    paper: '#FFFFFF',
    dark: '#172B4D',
  },
  text: {
    primary: '#344767',
    secondary: '#67748E',
    disabled: '#A0AEC0',
  },
};

// Create the theme
const theme = createTheme({
  palette: {
    ...colors,
    action: {
      active: colors.primary.main,
      hover: alpha(colors.primary.main, 0.1),
      selected: alpha(colors.primary.main, 0.16),
      disabled: alpha(colors.text.disabled, 0.3),
      disabledBackground: alpha(colors.text.disabled, 0.12),
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '0em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 12px 24px rgba(0, 0, 0, 0.05)',
    '0px 16px 32px rgba(0, 0, 0, 0.05)',
    '0px 20px 40px rgba(0, 0, 0, 0.05)',
    '0px 24px 48px rgba(0, 0, 0, 0.05)',
    '0px 28px 56px rgba(0, 0, 0, 0.05)',
    '0px 32px 64px rgba(0, 0, 0, 0.05)',
    '0px 36px 72px rgba(0, 0, 0, 0.05)',
    '0px 40px 80px rgba(0, 0, 0, 0.05)',
    '0px 44px 88px rgba(0, 0, 0, 0.05)',
    '0px 48px 96px rgba(0, 0, 0, 0.05)',
    '0px 52px 104px rgba(0, 0, 0, 0.05)',
    '0px 56px 112px rgba(0, 0, 0, 0.05)',
    '0px 60px 120px rgba(0, 0, 0, 0.05)',
    '0px 64px 128px rgba(0, 0, 0, 0.05)',
    '0px 68px 136px rgba(0, 0, 0, 0.05)',
    '0px 72px 144px rgba(0, 0, 0, 0.05)',
    '0px 76px 152px rgba(0, 0, 0, 0.05)',
    '0px 80px 160px rgba(0, 0, 0, 0.05)',
    '0px 84px 168px rgba(0, 0, 0, 0.05)',
    '0px 88px 176px rgba(0, 0, 0, 0.05)',
    '0px 92px 184px rgba(0, 0, 0, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          backgroundImage: gradients.primary,
        },
        containedPrimary: {
          backgroundImage: gradients.primary,
        },
        containedSecondary: {
          backgroundImage: gradients.secondary,
        },
        containedSuccess: {
          backgroundImage: gradients.success,
        },
        containedError: {
          backgroundImage: gradients.error,
        },
        containedWarning: {
          backgroundImage: gradients.warning,
        },
        containedInfo: {
          backgroundImage: gradients.info,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundImage: gradients.primary,
        },
        colorSecondary: {
          backgroundImage: gradients.secondary,
        },
        colorSuccess: {
          backgroundImage: gradients.success,
        },
        colorError: {
          backgroundImage: gradients.error,
        },
        colorWarning: {
          backgroundImage: gradients.warning,
        },
        colorInfo: {
          backgroundImage: gradients.info,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: gradients.dark,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.primary.main, 0.05),
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.03),
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: colors.text.primary,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
        },
        colorPrimary: {
          backgroundImage: `linear-gradient(90deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.primary.main, 0.2)} 100%)`,
        },
        barColorPrimary: {
          backgroundImage: gradients.primary,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        standardSuccess: {
          backgroundImage: `linear-gradient(135deg, ${alpha(colors.success.main, 0.1)} 0%, ${alpha(colors.success.main, 0.2)} 100%)`,
        },
        standardError: {
          backgroundImage: `linear-gradient(135deg, ${alpha(colors.error.main, 0.1)} 0%, ${alpha(colors.error.main, 0.2)} 100%)`,
        },
        standardWarning: {
          backgroundImage: `linear-gradient(135deg, ${alpha(colors.warning.main, 0.1)} 0%, ${alpha(colors.warning.main, 0.2)} 100%)`,
        },
        standardInfo: {
          backgroundImage: `linear-gradient(135deg, ${alpha(colors.info.main, 0.1)} 0%, ${alpha(colors.info.main, 0.2)} 100%)`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
        },
        elevation4: {
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// Export gradients for use in custom components
export { gradients, colors };

export default theme; 