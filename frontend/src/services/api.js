import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/* Core */
export const fetchCities = () => api.get('/locations/cities').then((r) => r.data.data);
export const fetchLocations = () => api.get('/locations').then((r) => r.data.data);

/* Air quality */
export const fetchLatest = (params = {}) => api.get('/air-quality/latest', { params }).then((r) => r.data.data);
export const fetchLatestByCity = (params = {}) => api.get('/air-quality/latest-by-city', { params }).then((r) => r.data.data);
export const fetchAqiTrend = (params = {}) => api.get('/air-quality/aqi-trend', { params }).then((r) => r.data);
export const fetchTrends = (params = {}) => api.get('/air-quality/trends', { params }).then((r) => r.data);

/* KPIs */
export const fetchSummary = (params = {}) => api.get('/kpi/summary', { params }).then((r) => r.data);
export const fetchPollutantBreakdown = (params = {}) => api.get('/kpi/pollutant-breakdown', { params }).then((r) => r.data);
export const fetchCategoryDistribution = (params = {}) => api.get('/kpi/category-distribution', { params }).then((r) => r.data);
export const fetchCityRanking = (params = {}) => api.get('/kpi/city-ranking', { params }).then((r) => r.data);

/* Insights (new) */
export const fetchHourlyPattern = (params = {}) => api.get('/insights/hourly-pattern', { params }).then((r) => r.data);
export const fetchWeeklyPattern = (params = {}) => api.get('/insights/weekly-pattern', { params }).then((r) => r.data);
export const fetchHeatmap = (params = {}) => api.get('/insights/heatmap', { params }).then((r) => r.data);
export const fetchMultiPollutant = (params = {}) => api.get('/insights/multi-pollutant', { params }).then((r) => r.data);
export const fetchWhoComparison = (params = {}) => api.get('/insights/who-comparison', { params }).then((r) => r.data);
export const fetchTodayVsYesterday = (params = {}) => api.get('/insights/today-vs-yesterday', { params }).then((r) => r.data);
export const fetchDistribution = (params = {}) => api.get('/insights/distribution', { params }).then((r) => r.data);
export const fetchExtremes = (params = {}) => api.get('/insights/extremes', { params }).then((r) => r.data);
export const fetchStreak = (params = {}) => api.get('/insights/streak', { params }).then((r) => r.data);
export const fetchComparison = (params = {}) => api.get('/insights/comparison', { params }).then((r) => r.data);
export const fetchDominantFreq = (params = {}) => api.get('/insights/dominant', { params }).then((r) => r.data);
export const fetchPlainInsights = (params = {}) => api.get('/insights/insights', { params }).then((r) => r.data);
export const fetchDataSource = () => api.get('/insights/data-source').then((r) => r.data);

/* Alerts */
export const fetchActiveAlerts = () => api.get('/alerts/active').then((r) => r.data.data);
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);
export const dismissAllAlerts = () => api.post('/alerts/dismiss-all').then((r) => r.data);

/* Forecast */
export const fetchForecast = (city, params = {}) =>
  api.get(`/forecast/${encodeURIComponent(city)}`, { params }).then((r) => r.data);

/* ETL */
export const triggerEtl = () => api.post('/etl/run').then((r) => r.data);

export default api;
