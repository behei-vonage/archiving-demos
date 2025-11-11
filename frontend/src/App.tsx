import './App.css';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Typography,
  Container,
  Box,
  LinearProgress
} from '@mui/material';
import ArchiveList from './components/ArchiveList';
import ArchiveManager from './components/ArchiveManager';
import { useVonageApi } from './hooks/useVonageApi';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeightRegular: 500,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  const {
    archives,
    loading,
    stopArchive,
    listArchives
  } = useVonageApi();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Loading Progress */}
      {loading && (
        <LinearProgress color="secondary" />
      )}

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading && (
          <Box sx={{ 
            textAlign: 'center', 
            p: 3, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            mb: 4,
            boxShadow: 1
          }}>
            <Typography variant="h6" color="primary">
              Setting up session and video connection...
            </Typography>
          </Box>
        )}

        {/* Archive Management */}
        <ArchiveManager />

        {/* Archive List */}
        <ArchiveList
          archives={archives}
          onStopArchive={stopArchive}
          onRefreshArchives={listArchives}
        />
      </Container>
    </ThemeProvider>
  )
}

export default App
