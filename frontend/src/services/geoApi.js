import apiClient from './apiClient';

export const detectCurrency = () => apiClient.get('/geo/currency');
