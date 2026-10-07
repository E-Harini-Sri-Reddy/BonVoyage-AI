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

    // Vite proxy returns 502 when the Express backend is restarting or offline
    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject(
        new Error('API server is temporarily unavailable. Make sure the backend is running on port 5000.')
      );
    }

    if (error.code === 'ERR_NETWORK' || message.includes('Network Error')) {
      return Promise.reject(
        new Error('Cannot reach the API. Start the app with npm run dev from the project root.')
      );
    }

    return Promise.reject(new Error(message));
  }
);

export const healthCheck = () => apiClient.get('/health');
export const planTrip = (tripData) => apiClient.post('/trip/plan', tripData);

export default apiClient;
