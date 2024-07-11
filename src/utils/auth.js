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