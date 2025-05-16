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
import { useParams, useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Level {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

const LevelPage: React.FC = () => {
  const [level, setLevel] = useState<Level | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`http://localhost:8080/api/levels/${levelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLevel(response.data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка при загрузке уровня');
        setLoading(false);
      }
    };

    fetchLevel();
  }, [levelId]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [level?.questions[currentQuestionIndex].id || 0]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (level?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(answers[level?.questions[currentQuestionIndex + 1].id || 0] || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[level?.questions[currentQuestionIndex - 1].id || 0] || '');
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer
      }));

      await axios.post(`http://localhost:8080/api/levels/${levelId}/complete`, {
        answers: formattedAnswers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/module');
    } catch (err) {
      setError('Ошибка при отправке ответов');
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
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const currentQuestion = level?.questions[currentQuestionIndex];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {level?.title}
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          {level?.description}
        </Typography>

        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mt: 2 }}>
          Вопрос {currentQuestionIndex + 1} из {level?.questions.length}
        </Typography>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion?.text}
          </Typography>
          <FormControl component="fieldset">
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
          {currentQuestionIndex === (level?.questions.length || 0) - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              Завершить уровень
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
    </Container>
  );
};

export default LevelPage; 