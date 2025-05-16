import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Базовая валидация
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      await register(username, email, password);
      // После успешной регистрации сразу перенаправляем на тест
      navigate('/placement-test');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.error;
        switch (errorMessage) {
          case 'user already exists':
            setError('Пользователь с таким email уже существует');
            break;
          case 'invalid email':
            setError('Неверный формат email');
            break;
          case 'password too short':
            setError('Пароль должен содержать минимум 6 символов');
            break;
          default:
            setError('Ошибка при регистрации. Пожалуйста, попробуйте еще раз');
        }
      } else {
        setError('Ошибка при регистрации. Пожалуйста, попробуйте еще раз');
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Регистрация
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Имя пользователя"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email адрес"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Минимум 6 символов"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Зарегистрироваться
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={RouterLink} to="/auth" variant="body2">
              Уже есть аккаунт? Войдите
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterForm; 