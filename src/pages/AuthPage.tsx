import React from 'react';
import { Box, Container } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';

const AuthPage: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
        <LoginForm />
      </Box>
    </Container>
  );
};

export default AuthPage; 