import apiClient from './apiClient';

// ============ CONFLICTS ============
export const getConflicts = () => {
  return apiClient.get('/conflicts');
};

// ============ CLIENT CONNECTIONS ============
export const getClientConnections = (clientId) => {
  return apiClient.get(`/client-connections/${clientId}`);
};

// ============ RISK ANALYSIS ============
export const getRiskAnalysis = (clientId) => {
  return apiClient.get(`/risk-analysis/${clientId}`);
};

// ============ GRAPH DATA ============
export const getGraphData = (entityType, searchValue, depth = 3) => {
  return apiClient.get(
    `/graph/${entityType}/${encodeURIComponent(searchValue)}?depth=${depth}`
  );
};

// ============ WHOLE AURA NETWORK ============
export const getNetworkData = () => apiClient.get('/network');

// ============ ALERTS ============
export const getAlerts = () => {
  return apiClient.get('/alerts');
};

// ============ SHORTEST PATH ============
export const getShortestPath = (source, target) => {
  return apiClient.get('/shortest-path', {
    params: { entity1: source, entity2: target },
  });
};

// ============ RISK PROPAGATION ============
export const getRiskPropagation = (name) => {
  // Case numbers commonly contain slashes (for example SC/SLA/115/2006).
  // Encode the path value so Express receives one name parameter, not several
  // accidental route segments.
  return apiClient.get(`/risk-propagation/${encodeURIComponent(name)}`);
};

export default {
  getConflicts,
  getClientConnections,
  getRiskAnalysis,
  getGraphData,
  getNetworkData,
  getAlerts,
  getShortestPath,
  getRiskPropagation,
};
