import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      
      // Получаем уровень пользователя из контекста, а не из localStorage
      const userLevel = user?.level;
      
      // Проверяем уровень и перенаправляем пользователя
      if (!userLevel || userLevel === '0') {
        navigate('/placement-test');
      } else {
        navigate('/module');
      }
    } catch (err) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Вход
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email адрес"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Войти
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={RouterLink} to="/register" variant="body2">
              Нет аккаунта? Зарегистрируйтесь
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginForm; 