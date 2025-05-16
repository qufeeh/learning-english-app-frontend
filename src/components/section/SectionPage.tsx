import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Section {
  id: number;
  name: string;
  description: string;
  order: number;
  questions: Question[];
  isLocked?: boolean;
}

interface DebugInfo {
  userLevel?: string;
  sectionId?: string;
  contentResponse?: any;
  contentError?: any;
  levelFolder?: string;
  sectionData?: any;
  [key: string]: any;
}

const SectionPage: React.FC = () => {
  const [section, setSection] = useState<Section | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);
  const { sectionId } = useParams<{ sectionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [debug, setDebug] = useState<DebugInfo>({});

  // Положительные фразы для правильных ответов
  const positiveMessages = [
    "Правильно!", 
    "Отлично!", 
    "Так держать!", 
    "Молодец!", 
    "Верно!", 
    "Прекрасно!", 
    "Да!",
    "Вы правы!"
  ];

  // Отрицательные фразы для неправильных ответов
  const negativeMessages = [
    "К сожалению, нет", 
    "Не совсем так", 
    "Неверно", 
    "Ошибка", 
    "Попробуйте еще раз"
  ];

  useEffect(() => {
    const fetchSection = async () => {
      try {
        if (!user) {
          setError('Данные пользователя недоступны');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Ошибка авторизации');
          setLoading(false);
          return;
        }

        if (!sectionId) {
          setError('Идентификатор раздела не указан');
          setLoading(false);
          return;
        }

        if (!user.level || user.level === '0') {
          setError('Пожалуйста, пройдите тест для определения уровня');
          setLoading(false);
          return;
        }

        // Определяем папку для уровня пользователя
        const levelFolder = levelMapping[user.level as keyof typeof levelMapping];
        if (!levelFolder) {
          setError(`Неизвестный уровень пользователя: ${user.level}`);
          setLoading(false);
          return;
        }

        // Сохраняем информацию о пользователе и его уровне
        setDebug({
          userLevel: user.level,
          sectionId: sectionId,
          levelFolder: levelFolder
        });

        console.log(`Загружаем данные из папки ${levelFolder} для раздела ${sectionId}`);

        try {
          // Получаем содержимое JSON файла для уровня пользователя
          // Предполагаем, что сервер предоставляет эндпоинт для доступа к файлам
          const contentResponse = await axios.get(`http://localhost:8080/api/content/${levelFolder}.json`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setDebug(prev => ({
            ...prev,
            contentResponse: contentResponse.data
          }));

          if (!contentResponse.data || !contentResponse.data.sections) {
            setError(`Данные для уровня ${user.level} не найдены`);
            setLoading(false);
            return;
          }

          // Ищем нужный раздел по ID в содержимом файла
          // Гарантируем, что у каждого раздела будет id = index + 1
          const sectionsWithIds = contentResponse.data.sections.map((section: any, index: number) => ({
            ...section,
            id: index + 1
          }));

          // Ищем нужный раздел по id
          const sectionData = sectionsWithIds.find(
            (section: any) => section.id === parseInt(sectionId || '0')
          );

          setDebug(prev => ({
            ...prev,
            sectionData: sectionData
          }));

          if (!sectionData) {
            setError(`Раздел с ID ${sectionId} для уровня ${user.level} не найден`);
            setLoading(false);
            return;
          }

          // Преобразуем данные в формат, понятный компоненту
          const processedSection: Section = {
            id: sectionData.id,
            name: sectionData.title || 'Unnamed Section',
            description: sectionData.description || '',
            order: sectionData.id,
            questions: sectionData.questions.map((q: any, index: number) => ({
              id: q.id || index + 1,
              text: q.text || '',
              options: q.options || [],
              correct_answer: q.correct_answer || '',
              explanation: q.explanation || ''
            })),
            isLocked: false
          };
 
          // Проверяем, что у раздела есть вопросы
          if (!processedSection.questions || processedSection.questions.length === 0) {
            setError(`В разделе "${processedSection.name}" нет вопросов`);
            setLoading(false);
            return;
          }
// *проблема в работе над ошибками и занесению в БД теста даже если он не пройден*
          setSection(processedSection);
          setLoading(false);
        } catch (contentError) {
          console.error('Ошибка при загрузке содержимого:', contentError);
          
          setDebug(prev => ({
            ...prev,
            contentError: contentError
          }));

          setError(`Ошибка при загрузке содержимого для уровня ${user.level}`);
          setLoading(false);
        }
      } catch (err) {
        console.error('Общая ошибка при загрузке раздела:', err);
        
        setDebug(prev => ({
          ...prev,
          error: err
        }));
        
        setError('Произошла ошибка при загрузке раздела');
        setLoading(false);
      }
    };

    fetchSection();
  }, [sectionId, user]);

  useEffect(() => {
    if (isReviewMode) {
      setSelectedAnswer('');
      setShowFeedback(false);
    }
  }, [isReviewMode]);

  const getRandomMessage = (isCorrect: boolean) => {
    const messages = isCorrect ? positiveMessages : negativeMessages;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return; // Не меняем ответ после показа обратной связи
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!section || !section.questions[currentQuestionIndex]) return;
    
    const currentQuestion = section.questions[currentQuestionIndex];
    const isAnswerCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // Update answers
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));

    // Update local state
    setIsCorrect(isAnswerCorrect);
    setFeedbackMessage(getRandomMessage(isAnswerCorrect));
    setShowFeedback(true);

    if (!isAnswerCorrect) {
      setMistakes(prev => [...prev, currentQuestionIndex]);
    }

    // Move to next question or complete section
    if (currentQuestionIndex < section.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
      }, 2000);
    } else {
      // Check if all questions were answered correctly
      const allCorrect = Object.values(answers).every((answer, index) => 
        answer === section.questions[index].correct_answer
      );

      if (allCorrect) {
        // Mark section as completed
        await handleCompleteSection();
      } else {
        setIsReviewMode(true);
        setReviewQuestionIndex(0);
      }
    }
  };

  const handleCompleteSection = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Ошибка авторизации');
            return;
        }

        // Отмечаем раздел как завершенный
        await axios.post(
            `http://localhost:8080/api/sections/${section?.id}/complete`,
            {
                name: section?.name,
                description: section?.description,
                level: user?.level // Добавляем уровень пользователя
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        // Проверяем прогресс пользователя
        const progressResponse = await axios.get('http://localhost:8080/api/user/check-progress', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (progressResponse.data.completed) {
            setFeedbackMessage(`Поздравляем! Вы успешно завершили все разделы уровня ${progressResponse.data.old_level} и переходите на уровень ${progressResponse.data.new_level}!`);
        } else {
            setFeedbackMessage('Поздравляем! Вы успешно завершили раздел!');
        }

        setShowFeedback(true);
        setTimeout(() => {
            navigate('/module', { state: { sectionCompleted: true } });
        }, 3000);
    } catch (err) {
        console.error('Error completing section:', err);
        setError('Ошибка при завершении раздела');
    }
  };

  const handleReviewAnswer = () => {
    if (!section) return;
    
    const questionIndex = mistakes[reviewQuestionIndex];
    const currentQuestion = section.questions[questionIndex];
    const isAnswerCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // Обновляем ответы
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));
    
    // Показываем обратную связь
    setIsCorrect(isAnswerCorrect);
    setFeedbackMessage(getRandomMessage(isAnswerCorrect));
    setShowFeedback(true);
    
    // Автоматически переходим к следующему вопросу через 2 секунды
    setTimeout(() => {
      setShowFeedback(false);
      if (reviewQuestionIndex < mistakes.length - 1) {
        setReviewQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        // Завершаем раздел после исправления ошибок
        handleCompleteSection();
      }
    }, 2000);
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
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/module')}
          sx={{ mt: 2 }}
        >
          Вернуться к модулям
        </Button>
        
        {/* Отладочная информация */}
        {DEBUG_MODE && (
          <Box mt={5}>
            <Divider />
            <Typography variant="caption" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              Отладочная информация: {JSON.stringify(debug, null, 2)}
            </Typography>
          </Box>
        )}
      </Container>
    );
  }

  if (!section || !section.questions || section.questions.length === 0) {
    return (
      <Container>
        <Alert severity="warning">В этом разделе нет вопросов.</Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/module')}
          sx={{ mt: 2 }}
        >
          Вернуться к модулям
        </Button>
        
        {/* Отладочная информация */}
        {DEBUG_MODE && (
          <Box mt={5}>
            <Divider />
            <Typography variant="caption" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              Отладочная информация: {JSON.stringify(debug, null, 2)}
            </Typography>
          </Box>
        )}
      </Container>
    );
  }

  // Выбираем текущий вопрос в зависимости от режима
  const currentQuestion = isReviewMode 
    ? section.questions[mistakes[reviewQuestionIndex]] 
    : section.questions[currentQuestionIndex];

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Раздел {section.order}. {section.name}
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          {section.description}
        </Typography>

        {isReviewMode ? (
          <Typography variant="subtitle1" gutterBottom align="center" sx={{ mt: 2 }}>
            Работа над ошибками: Вопрос {reviewQuestionIndex + 1} из {mistakes.length}
          </Typography>
        ) : (
          <Typography variant="subtitle1" gutterBottom align="center" sx={{ mt: 2 }}>
            Вопрос {currentQuestionIndex + 1} из {section.questions.length}
          </Typography>
        )}

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion?.text}
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(e.target.value)}
            >
              {currentQuestion?.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{
                    backgroundColor: showFeedback 
                      ? option === currentQuestion.correct_answer 
                        ? 'rgba(76, 175, 80, 0.1)' // Зеленый для правильного ответа
                        : option === selectedAnswer 
                          ? 'rgba(244, 67, 54, 0.1)' // Красный для выбранного неправильного
                          : 'transparent'
                      : 'transparent',
                    p: 1,
                    borderRadius: 1,
                    mb: 1
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box mt={4} display="flex" justifyContent="center">
          {isReviewMode ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleReviewAnswer}
              disabled={!selectedAnswer || showFeedback}
            >
              Ответить
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || showFeedback}
            >
              Ответить
            </Button>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={showFeedback}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={isCorrect ? "success" : "error"}
          sx={{ width: '100%' }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
      
      {/* Отладочная информация */}
      {DEBUG_MODE && (
        <Box mt={5}>
          <Divider />
          <Typography variant="caption" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
            Отладочная информация: {JSON.stringify(debug, null, 2)}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default SectionPage; 