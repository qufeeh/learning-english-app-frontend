import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import RegisterForm from './components/auth/RegisterForm';
import PlacementTest from './components/placement/PlacementTest';
import ModulePage from './components/module/ModulePage';
import SectionPage from './components/section/SectionPage';
import TranslatorPage from './components/translator/TranslatorPage';
import TextbookPage from './components/textbook/TextbookPage';
import Header from './components/header/Header';

const ProtectedLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header />
    <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#fff' }}>
      <Routes>
        <Route path="/module" element={<ModulePage />} />
        <Route path="/section/:sectionId" element={<SectionPage />} />
        <Route path="/translator" element={<TranslatorPage />} />
        <Route path="/textbook" element={<TextbookPage />} />
        <Route path="/placement-test" element={<PlacementTest />} />
        <Route path="*" element={<Navigate to="/module" replace />} />
      </Routes>
    </Box>
  </Box>
);

const PublicLayout = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/auth" replace />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/register" element={<RegisterForm />} />
    <Route path="*" element={<Navigate to="/auth" replace />} />
  </Routes>
);

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%' }} />;
  }

  return isAuthenticated ? <ProtectedLayout /> : <PublicLayout />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/*" element={<AppRouter />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;