// Header.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Header = () => {
  const { user, isAuthenticated, logout, refreshUserData } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // Получение прогресса пользователя
  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:8080/api/user/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(Math.round(response.data.progress));
    } catch (err) {
      console.error('Ошибка загрузки прогресса:', err);
    }

  };

  // Обработчики меню профиля
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Обработчик смены пароля
  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        'http://localhost:8080/api/user/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenPassword(false);
      setError('');
    } catch (err) {
      setError('Ошибка при смене пароля. Проверьте старый пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBar position="static" sx={{
        bgcolor: '#2e7d32',
        mb: 4,
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
         }}>
      <Toolbar>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, marginRight: 4 }}>
          Learn English
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button color="inherit" onClick={() => navigate('/module')}>Разделы</Button>
          <Button color="inherit" onClick={() => navigate('/translator')}>Переводчик</Button>
        </Box>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ bgcolor: 'white', color: '#2e7d32' }}>
                {user?.username[0].toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => {
                setOpenProfile(true);
                fetchProgress();
                handleMenuClose();
              }}>
                Профиль
              </MenuItem>
              <MenuItem onClick={() => {
                logout();
                navigate('/auth');
                handleMenuClose();
              }}>
                Выход
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="inherit" onClick={() => navigate('/auth')}>Войти</Button>
        )}
      </Toolbar>

      {/* Диалог профиля */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)}>
        <DialogTitle>Профиль пользователя</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {user?.username}
          </Typography>
          <Typography gutterBottom>
            Прогресс: {progress}%
          </Typography>
          <Box sx={{ width: '100%', height: 20, backgroundColor: '#e0e0e0', borderRadius: 10 }}>
            <Box 
              sx={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#2e7d32',
                borderRadius: 10,
                transition: 'width 0.5s ease'
              }}
            />
          </Box>
          <Button 
            fullWidth 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setOpenPassword(true)}
          >
            Сменить пароль
          </Button>
        </DialogContent>
      </Dialog>

<Dialog open={openPassword} onClose={() => setOpenPassword(false)}>
  <DialogTitle>Смена пароля</DialogTitle>
  <DialogContent>
    <TextField
      fullWidth
      margin="normal"
      label="Текущий пароль"
      type="password"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
    />
    <TextField
      fullWidth
      margin="normal"
      label="Новый пароль"
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      helperText="Минимум 6 символов"
    />
    {error && <Typography color="error">{error}</Typography>}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenPassword(false)}>Отмена</Button>
    <Button 
      onClick={handlePasswordChange} 
      disabled={loading || newPassword.length < 6}
      startIcon={loading && <CircularProgress size={20} />}
    >
      Сохранить
    </Button>
  </DialogActions>
</Dialog>
    </AppBar>
  );
};

export default Header;