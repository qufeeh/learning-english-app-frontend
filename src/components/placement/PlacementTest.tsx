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
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
  level: string;
  points: number;
}

interface TestResult {
  score: number;
  level: string;
  maxScore: number;
}

// Флаг для отображения отладочной информации
const DEBUG_MODE = false;

const PlacementTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [debug, setDebug] = useState<Record<string, any>>({});
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('Загрузка вопросов пробного теста...');
        setDebug((prev: Record<string, any>) => ({ ...prev, loadingStarted: true }));
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Токен авторизации не найден. Войдите в систему и попробуйте снова.');
          setLoading(false);
          return;
        }
        
        try {
          // Получаем вопросы теста с сервера
          const response = await axios.get('http://localhost:8080/api/placement-test', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Ответ API:', response.data);
          setDebug((prev: Record<string, any>) => ({ ...prev, apiResponse: response.data }));
          
          // Обрабатываем разные форматы ответа
          let questionData = [];
          if (response.data && Array.isArray(response.data)) {
            questionData = response.data;
          } else if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
            questionData = response.data.questions;
          } else {
            throw new Error('Неожиданный формат ответа от API');
          }
          
          setDebug((prev: Record<string, any>) => ({ ...prev, questionData }));
          
          if (questionData.length === 0) {
            throw new Error('Не найдены вопросы для теста');
          }
          
          setQuestions(questionData);
          setLoading(false);
        } catch (apiError) {
          console.error('Ошибка при загрузке вопросов с сервера:', apiError);
          setDebug((prev: Record<string, any>) => ({ ...prev, apiError }));
          setError('Не удалось загрузить вопросы теста. Пожалуйста, попробуйте позже.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Неожиданная ошибка при загрузке вопросов:', err);
        setDebug((prev: Record<string, any>) => ({ ...prev, unexpectedError: err }));
        setError('Произошла ошибка при загрузке теста.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(answers[questions[currentQuestionIndex + 1].id] || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[questions[currentQuestionIndex - 1].id] || '');
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('Отправка ответов теста...');
      setDebug((prev: Record<string, any>) => ({ ...prev, submittingAnswers: true, answers }));
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Токен авторизации не найден. Войдите в систему и попробуйте снова.');
        return;
      }
      
      // Форматируем ответы для отправки на сервер
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer
      }));

      console.log('Отправляемые ответы:', formattedAnswers);
      setDebug((prev: Record<string, any>) => ({ ...prev, formattedAnswers }));

      try {
        // Отправляем ответы на сервер
        const response = await axios.post('http://localhost:8080/api/placement-test', {
          answers: formattedAnswers
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Ответ сервера:', response.data);
        setDebug((prev: Record<string, any>) => ({ ...prev, submitResponse: response.data }));
        
        // Проверяем, что сервер вернул результат
        if (response.data && (response.data.level || response.data.score !== undefined)) {
          setResult({
            score: response.data.score || 0,
            level: response.data.level || 'A1',
            maxScore: response.data.max_score || response.data.maxScore || 20
          });
          setTestCompleted(true);
          
          // Обновляем данные пользователя после успешного прохождения теста
          await refreshUserData();
          setDebug((prev: Record<string, any>) => ({ ...prev, userDataRefreshed: true, user }));
          
          // Перенаправляем на страницу модулей с указанием, что пришли с теста
          navigate('/module', { state: { fromTest: true } });
        } else {
          throw new Error('Сервер вернул неполные данные о результате теста');
        }
      } catch (submitError) {
        console.error('Ошибка при отправке ответов:', submitError);
        setDebug((prev: Record<string, any>) => ({ ...prev, submitError }));
        setError('Не удалось отправить результаты теста. Попробуйте еще раз.');
      }
    } catch (err) {
      console.error('Общая ошибка при завершении теста:', err);
      setDebug((prev: Record<string, any>) => ({ ...prev, generalSubmitError: err }));
      setError('Ошибка при отправке ответов. Пожалуйста, попробуйте еще раз.');
    }
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
        <Box mt={2} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={() => navigate('/module')}>
            Перейти к обучению
          </Button>
        </Box>
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

  if (testCompleted && result) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Тест завершен!
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            Ваш уровень: {result.level}
          </Typography>
          <Typography variant="body1" gutterBottom align="center">
            Вы набрали {result.score} из {result.maxScore} баллов
          </Typography>
          <Box mt={4} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/module', { state: { fromTest: true } })}
            >
              Перейти к обучению
            </Button>
          </Box>
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

  // Проверка наличия вопросов
  if (!questions || questions.length === 0) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Вопросы для теста не найдены. Пожалуйста, свяжитесь с администратором.
        </Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={() => navigate('/module')}>
            Перейти к обучению
          </Button>
        </Box>
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Тест для определения вашего уровня английского языка
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Вопрос {currentQuestionIndex + 1} из {questions.length}
        </Typography>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.text}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(e.target.value)}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Назад
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              Завершить тест
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!selectedAnswer}
            >
              Следующий вопрос
            </Button>
          )}
        </Box>
      </Paper>
      {DEBUG_MODE && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6">Отладочная информация:</Typography>
          <Typography variant="body2" component="pre">
            {JSON.stringify({
              currentQuestion,
              currentIndex: currentQuestionIndex,
              totalQuestions: questions.length,
              selectedAnswer,
              answers,
              user
            }, null, 2)}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PlacementTest; 