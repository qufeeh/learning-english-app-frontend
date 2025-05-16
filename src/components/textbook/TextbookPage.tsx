import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface LessonContent {
  title: string;
  content: string;
  examples: string[];
}

interface Section {
  title: string;
  description: string;
  lessons: LessonContent[];
}

const TextbookPage = () => {
  const [content, setContent] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const level = user?.level.toLowerCase().replace(' ', '-');
        const response = await axios.get(`/api/content/${level}.json`);
        setContent(response.data.sections);
      } catch (err) {
        setError('Не удалось загрузить учебные материалы');
        console.error('Error loading textbook:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.level && user.level !== '0') {
      loadContent();
    }
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#2e7d32', mb: 4 }}>
        Учебник - {user?.level}
      </Typography>

      {content.map((section, index) => (
        <Accordion key={index} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Раздел {index + 1}: {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph sx={{ mb: 3 }}>
              {section.description}
            </Typography>

            <List>
              {section.lessons.map((lesson, lessonIndex) => (
                <Paper key={lessonIndex} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {lesson.title}
                  </Typography>
                  <Typography paragraph>{lesson.content}</Typography>
                  
                  {lesson.examples.length > 0 && (
                    <>
                      <Typography variant="body2" color="textSecondary">
                        Примеры:
                      </Typography>
                      <List dense>
                        {lesson.examples.map((example, exIndex) => (
                          <ListItem key={exIndex}>
                            <ListItemText
                              primary={example}
                              sx={{ fontStyle: 'italic' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Paper>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default TextbookPage;