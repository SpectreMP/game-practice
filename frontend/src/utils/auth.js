/**
 * Client-side authentication utilities.
 */

import config from '../../config';

export const setTokens = (access_token, refresh_token) => {
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
};

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const removeTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const refreshToken = async () => {
  try {
    const response = await fetch(`${config.apiUrl}/api/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: getRefreshToken()
      }),
    });

    if (response.ok) {
      const { access_token, refresh_token } = await response.json();
      setTokens(access_token, refresh_token);
      return true;
    } else {
      removeTokens();
      return false;
    }
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    removeTokens();
    return false;
  }
};

export const fetchWithToken = async (url, options = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });

  if (response.status === 401) { // Unauthorized
    const refreshSuccess = await refreshToken();
    if (refreshSuccess) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });
    } else {
      throw new Error('Ошибка аутентификации');
    }
  }

  return response;
};