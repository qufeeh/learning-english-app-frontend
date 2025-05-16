import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Флаг для отображения отладочной информации
const DEBUG_MODE = false;

// Соответствие уровней пользователя и папок с учебными материалами
const levelMapping = {
  'A1': 'beginner',
  'A2': 'pre-intermediate',
  'B1': 'intermediate',
  'B2': 'upper-intermediate',
  'C1': 'advanced',
  'C2': 'proficient'
};

// Соответствие кодов уровней и их названий для отображения
const levelNames = {
  'A1': 'Beginner',
  'A2': 'Pre-Intermediate',
  'B1': 'Intermediate',
  'B2': 'Upper-Intermediate',
  'C1': 'Advanced',
  'C2': 'Proficient'
};

interface Module {
  id: number;
  name: string;
  level: string;
  description: string;
  order: number;
  sections: Section[];
}

interface Section {
  id: number;
  name: string;
  description: string;
  order: number;
  isLocked: boolean;
  isCompleted?: boolean;
  lessons?: Lesson[];
  questions?: any[];
}

interface Lesson {
  id: number;
  name: string;
  description: string;
  level?: string;
  topic?: string;
  order: number;
  isLocked: boolean;
}

// Тип для отладочной информации
interface DebugInfo {
  userLevel?: string;
  contentResponse?: any;
  contentError?: any;
  levelFolder?: string;
  moduleData?: any;
  completedSections?: number[];
  [key: string]: any;
}

const ModulePage: React.FC = () => {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [debug, setDebug] = useState<DebugInfo>({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Показываем приветственный экран только если пользователь пришел с теста
    const fromTest = location.state?.fromTest || false;
    setShowWelcome(fromTest);
    
    console.log('ModulePage - fromTest:', fromTest);
    console.log('ModulePage - user:', user);

    const fetchModule = async () => {
      try {
        // Проверка наличия пользователя и его уровня
        if (!user) {
          console.log('ModulePage - нет пользователя');
          setError('Данные пользователя недоступны');
          setLoading(false);
          return;
        }

        if (!user.level || user.level === '0') {
          console.log('ModulePage - у пользователя нет уровня или уровень 0');
          setError('Пожалуйста, пройдите тест для определения уровня');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('ModulePage - нет токена');
          setError('Ошибка авторизации');
          setLoading(false);
          return;
        }

        // Определяем папку для уровня пользователя
        const levelFolder = levelMapping[user.level as keyof typeof levelMapping];
        if (!levelFolder) {
          console.log('ModulePage - неизвестный уровень:', user.level);
          setError(`Неизвестный уровень пользователя: ${user.level}`);
          setLoading(false);
          return;
        }

        // Инициализируем отладочную информацию
        setDebug({
          userLevel: user.level,
          levelFolder: levelFolder
        });

        console.log(`Загружаем данные из папки ${levelFolder} для пользователя с уровнем ${user.level}`);

        try {
          // Получаем содержимое JSON файла для уровня пользователя
          const contentResponse = await axios.get(`http://localhost:8080/api/content/${levelFolder}.json`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Получаем информацию о завершенных разделах
          const completedSectionsResponse = await axios.get('http://localhost:8080/api/sections/completed', {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Фильтруем только те разделы, которые завершены на текущем уровне пользователя
          const completedSectionIds = completedSectionsResponse.data
            .filter((section: any) => section.level === user.level)
            .map((section: any) => Number(section.section_id));

          console.log('completedSectionIds:', completedSectionIds);
          console.log('sections:', contentResponse.data.sections.map((s: any) => s.id));

          setDebug(prev => ({
            ...prev,
            contentResponse: contentResponse.data,
            completedSections: completedSectionIds
          }));

          if (!contentResponse.data) {
            setError(`Данные для уровня ${user.level} не найдены`);
            setLoading(false);
            return;
          }

          // Создаем модуль из полученных данных
          const moduleData: Module = {
            id: 1, // Просто используем 1 как ID модуля
            name: levelNames[user.level as keyof typeof levelNames] || contentResponse.data.level || "Module",
            level: user.level,
            description: contentResponse.data.description || `${levelNames[user.level as keyof typeof levelNames]} level English course`,
            order: 1,
            sections: contentResponse.data.sections.map((section: any, index: number) => ({
              id: index + 1, // временно используем index + 1 как id
              name: section.title, // Используем title вместо name
              description: section.description,
              order: section.order || index + 1, // если есть order, используем его, иначе индекс
              isLocked: false, // По умолчанию разблокировано
              isCompleted: completedSectionIds.includes(index + 1) // Проверяем завершённость по index + 1
            }))
          };

          setDebug(prev => ({
            ...prev,
            moduleData: moduleData
          }));

          // Проверяем наличие разделов
          if (!moduleData.sections || moduleData.sections.length === 0) {
            setError(`Для уровня ${user.level} не найдены разделы`);
            setLoading(false);
            return;
          }

          setModule(moduleData);
          setLoading(false);
        } catch (contentError) {
          console.error('ModulePage - ошибка при загрузке контента:', contentError);
          setError(`Ошибка при загрузке модуля: ${contentError}`);
          setDebug(prev => ({
            ...prev,
            contentError
          }));
          setLoading(false);
        }
      } catch (err) {
        console.error('ModulePage - общая ошибка:', err);
        setError('Произошла ошибка при загрузке данных');
        setLoading(false);
      }
    };

    // Загружаем модуль только если пользователь аутентифицирован
    if (user) {
      fetchModule();
    }
  }, [location.state, user]);

  const handleOkClick = () => {
    setShowWelcome(false);
    // Очищаем состояние locationSt ate
    navigate('/module', { replace: true });
  };

  const handleSectionClick = (sectionId: string | number) => {
    navigate(`/section/${sectionId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        {DEBUG_MODE && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6">Отладочная информация:</Typography>
            <Typography variant="body2" component="pre">
              {JSON.stringify(debug, null, 2)}
            </Typography>
          </Paper>
        )}
      </Container>
    );
  }

  if (!module) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Данные модуля не найдены. Пожалуйста, обновите страницу или свяжитесь с администратором.
        </Alert>
      </Container>
    );
  }

  if (showWelcome) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Добро пожаловать в курс английского языка!
          </Typography>
          <Typography variant="body1" paragraph>
            Ваш уровень: {levelNames[user?.level as keyof typeof levelNames] || 'Не определен'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleOkClick}
            sx={{ mt: 2 }}
          >
            Понятно
          </Button>
        </Paper>
        {DEBUG_MODE && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6">Отладочная информация:</Typography>
            <Typography variant="body2" component="pre">
              {JSON.stringify(debug, null, 2)}
            </Typography>
          </Paper>
        )}
      </Container>
    );
  }

  // Сортируем разделы по их порядковому номеру
  const sortedSections = [...(module.sections || [])].sort((a, b) => a.order - b.order);

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {module.name} - {module.level}
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          {module.description}
        </Typography>

        <Box mt={4} display="flex" flexDirection="column" gap={2}>
          {sortedSections.length > 0 ? (
            sortedSections.map((section) => (
              <Paper
                key={section.id}
                elevation={2}
                sx={{
                  p: 3,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'success.main',
                  color: '#fff',
                  transition: 'background 0.2s',
                  '&:hover': {
                    backgroundColor: 'success.dark',
                  },
                }}
                onClick={() => handleSectionClick(section.id)}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    Раздел {section.order}. {section.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#f0f0f0' }}>
                    {section.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {section.isCompleted && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Пройдено"
                      color="success"
                      variant="outlined"
                      sx={{ color: '#fff', borderColor: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                    />
                  )}
                  {section.isLocked && (
                    <Chip
                      label="Заблокировано"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Paper>
            ))
          ) : (
            <Alert severity="info">
              Разделы для этого модуля не найдены. Пожалуйста, свяжитесь с администратором.
            </Alert>
          )}
        </Box>
        
        {/* ВРЕМЕННЫЙ ДИАГНОСТИЧЕСКИЙ ВЫВОД */}
        <Box mt={4}>
          <Typography variant="body2" color="primary">
            completedSectionIds: {JSON.stringify(debug.completedSections)}
          </Typography>
          <Typography variant="body2" color="primary">
            section ids: {JSON.stringify(sortedSections.map(s => s.id))}
          </Typography>
        </Box>
        {/* КОНЕЦ ДИАГНОСТИКИ */}
        
        {/* Отладочная информация */}
        {DEBUG_MODE && (
          <Box mt={5}>
            <Divider />
            <Typography variant="caption" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              Отладочная информация: {JSON.stringify(debug, null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ModulePage; 