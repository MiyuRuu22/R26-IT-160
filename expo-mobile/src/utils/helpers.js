// Common utility functions for the mobile app

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time to readable string
 */
export const formatTime = (date) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (date) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return 'Unknown';

  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return 'Just now';
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Get color based on risk level/score
 */
export const getRiskColor = (risk) => {
  if (typeof risk === 'number') {
    if (risk >= 7) return '#FF3B30'; // High - Red
    if (risk >= 4) return '#FF9500'; // Medium - Orange
    return '#34C759'; // Low - Green
  }

  if (typeof risk === 'string') {
    const lower = risk.toLowerCase();
    if (lower.includes('high') || lower.includes('critical'))
      return '#FF3B30';
    if (lower.includes('medium')) return '#FF9500';
    if (lower.includes('low')) return '#34C759';
  }

  return '#999';
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  truncateText,
  getRiskColor,
  isValidEmail,
  formatNumber,
  deepClone,
};
