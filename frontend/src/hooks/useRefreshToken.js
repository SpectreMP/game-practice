import { getRefreshToken, setTokens, removeTokens } from '../utils/auth';
import config from './config';

const useRefreshToken = () => {
  const refreshToken = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getRefreshToken()}`,
        },
      });
      if (response.ok) {
        const { access_token, refresh_token } = await response.json();
        setTokens(access_token, refresh_token);
        return access_token;
      } else {
        removeTokens();
        window.location.href = '/sign-in';
      }
    } catch (error) {
      console.error('Ошибка при обновлении токена:', error);
      removeTokens();
      window.location.href = '/sign-in';
    }
  };

  return refreshToken;
};

export default useRefreshToken;