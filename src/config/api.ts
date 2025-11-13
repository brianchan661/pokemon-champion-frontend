/**
 * API Configuration
 * 
 * This module provides a centralized way to access the API base URL.
 * The NEXT_PUBLIC_API_URL environment variable should be set to the backend URL
 * without the /api suffix (e.g., https://backend.example.com).
 * 
 * This function automatically appends /api to create the full API base URL.
 */

/**
 * Get the API base URL with /api suffix
 * @returns The full API base URL (e.g., https://backend.example.com/api)
 */
export const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/api`;
};

/**
 * Get the backend base URL without /api suffix
 * Useful for OAuth redirects and other non-API endpoints
 * @returns The backend base URL (e.g., https://backend.example.com)
 */
export const getBackendBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
