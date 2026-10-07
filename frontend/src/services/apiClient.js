import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 180000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    if (status === 429) {
      return Promise.reject(new Error('Rate limit reached. Please wait a moment and try again.'));
    }

    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject(
        new Error(
          'API temporarily unavailable (service waking up or restarting). Wait a few seconds and retry.'
        )
      );
    }

    if (error.code === 'ERR_NETWORK' || message.includes('Network Error')) {
      return Promise.reject(
        new Error('Cannot reach the API. Check your connection or that the server is running.')
      );
    }

    return Promise.reject(new Error(message));
  }
);

export const healthCheck = () => apiClient.get('/health');
export const planTrip = (tripData) => apiClient.post('/trip/plan', tripData);

export default apiClient;
