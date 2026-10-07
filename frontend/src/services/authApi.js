import apiClient from './apiClient';

export const register = (data) => apiClient.post('/auth/register', data);
export const login = (data) => apiClient.post('/auth/login', data);
export const googleLogin = (credential) => apiClient.post('/auth/google', { credential });
export const logout = () => apiClient.post('/auth/logout');
export const getMe = () => apiClient.get('/auth/me');

export const getFavorites = () => apiClient.get('/auth/favorites');
export const saveFavorite = (data) => apiClient.post('/auth/favorites', data);
export const removeFavorite = (itemId) => apiClient.delete(`/auth/favorites/${itemId}`);

export const getRecentSearches = () => apiClient.get('/auth/recent');
export const saveRecentSearch = (search) => apiClient.post('/auth/recent', { search });
export const clearRecentSearchesApi = () => apiClient.delete('/auth/recent');
export const removeRecentSearch = (id) => apiClient.delete(`/auth/recent/${id}`);

export const getSavedTrips = () => apiClient.get('/auth/trips');
export const saveTrip = (data) => apiClient.post('/auth/trips', data);
export const deleteTrip = (id) => apiClient.delete(`/auth/trips/${id}`);

export const getPackingState = (tripKey) => apiClient.get(`/auth/packing/${tripKey}`);
export const savePackingState = (tripKey, checked) =>
  apiClient.put(`/auth/packing/${tripKey}`, { checked });
