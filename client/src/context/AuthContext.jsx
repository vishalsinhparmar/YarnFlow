import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/authAPI';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const response = await authAPI.verifyToken(storedToken);
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(email, password);
      
      setUser(response.data);
      setToken(response.token);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const response = await authAPI.register(email, password);
      
      setUser(response.data);
      setToken(response.token);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
