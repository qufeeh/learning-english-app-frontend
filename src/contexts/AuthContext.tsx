import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  level: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get('http://localhost:8080/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await axios.get('http://localhost:8080/api/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/signin', {
        email,
        password
      });

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);

      const userResponse = await axios.get('http://localhost:8080/api/user', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Ошибка при входе');
      }
      throw new Error('Ошибка при входе');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/signup', {
        username,
        email,
        password
      });

      console.log('Registration response:', response.data);

      const { access_token, refresh_token } = response.data;
      console.log('Access token:', access_token);
      console.log('Refresh token:', refresh_token);

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);

      const userResponse = await axios.get('http://localhost:8080/api/user', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      console.log('User data response:', userResponse.data);
      
      setUser(userResponse.data);
    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.error || 'Ошибка при регистрации');
      }
      throw new Error('Ошибка при регистрации');
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axios.post('http://localhost:8080/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUserData,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}; 