import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authApi = {
  register: (data: { email: string; password: string; display_name: string; role?: string }) =>
    api.post('/api/v1/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/v1/auth/login', data),
  me: () => api.get('/api/v1/auth/me'),
};

// Topics
export const topicsApi = {
  list: (params?: { tags?: string; cefr?: string; skip?: number; limit?: number }) =>
    api.get('/api/v1/topics', { params }),
  myTopics: () => api.get('/api/v1/topics/my'),
  get: (id: string) => api.get(`/api/v1/topics/${id}`),
  create: (data: unknown) => api.post('/api/v1/topics', data),
  update: (id: string, data: unknown) => api.put(`/api/v1/topics/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/topics/${id}`),
  publish: (id: string) => api.post(`/api/v1/topics/${id}/publish`),
  addCharacter: (topicId: string, data: unknown) => api.post(`/api/v1/topics/${topicId}/characters`, data),
  updateCharacter: (topicId: string, charId: string, data: unknown) =>
    api.put(`/api/v1/topics/${topicId}/characters/${charId}`, data),
  deleteCharacter: (topicId: string, charId: string) =>
    api.delete(`/api/v1/topics/${topicId}/characters/${charId}`),
};

// Sessions
export const sessionsApi = {
  create: (topic_id: string) => api.post('/api/v1/sessions', { topic_id }),
  get: (id: string) => api.get(`/api/v1/sessions/${id}`),
  start: (id: string) => api.put(`/api/v1/sessions/${id}/start`),
  end: (id: string) => api.put(`/api/v1/sessions/${id}/end`),
  transcript: (id: string) => api.get(`/api/v1/sessions/${id}/transcript`),
  evaluation: (id: string) => api.get(`/api/v1/sessions/${id}/evaluation`),
  history: (params?: { skip?: number; limit?: number }) =>
    api.get('/api/v1/sessions/history', { params }),
};

// Studio (AI generation)
export const studioApi = {
  generateCharacters: (data: {
    title: string;
    description: string;
    domain_knowledge: string;
    num_characters: number;
    cefr_levels: string[];
    tags: string[];
  }) => api.post('/api/v1/studio/generate-characters', data),
  generateConversation: (data: {
    title: string;
    domain_knowledge: string;
    characters: unknown[];
  }) => api.post('/api/v1/studio/generate-conversation', data),
};

export default api;
