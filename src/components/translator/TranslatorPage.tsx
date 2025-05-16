import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TranslatorPage = () => {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRuToEn, setIsRuToEn] = useState(false);
  const { user } = useAuth();

  const handleTranslate = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/translate', {
        text: text,
        source: isRuToEn ? 'ru' : 'en',
        target: isRuToEn ? 'en' : 'ru'
      });

      setTranslation(response.data.translation);
    } catch (err) {
      setError('Ошибка перевода. Попробуйте снова.');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    setIsRuToEn(!isRuToEn);
    setText(translation);
    setTranslation(text);
  };

  return (
    <Box sx={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      p: 3,
      backgroundColor: '#f5f5f5',
      borderRadius: 2,
      boxShadow: 3
    }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#2e7d32' }}>
        Переводчик
        <Typography variant="subtitle1" sx={{ color: '#666' }}>
          {isRuToEn ? 'Русский → Английский' : 'Английский → Русский'}
        </Typography>
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRuToEn ? 'Введите текст на русском...' : 'Введите текст на английском...'}
          variant="outlined"
          sx={{ 
            backgroundColor: 'white',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
            }
          }}
        />

        <IconButton
          onClick={handleSwapLanguages}
          sx={{ 
            backgroundColor: '#2e7d32',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1b5e20'
            }
          }}
        >
          <SwapHorizIcon />
        </IconButton>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={handleTranslate}
        disabled={loading || !text.trim()}
        sx={{
          mb: 3,
          bgcolor: '#2e7d32',
          '&:hover': { bgcolor: '#1b5e20' },
          height: '48px'
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Перевести'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {translation && (
        <Paper elevation={0} sx={{ 
          p: 3, 
          backgroundColor: 'white',
          borderRadius: 1,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
            {translation}
          </Typography>
        </Paper>
      )}

      {!user && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Для сохранения истории переводов войдите в систему
        </Alert>
      )}
    </Box>
  );
};

export default TranslatorPage;