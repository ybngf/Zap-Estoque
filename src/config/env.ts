/**
 * Environment configuration for production deployment
 * This file will be used during the build process
 */

// API URL - will be set based on deployment environment
export const API_URL = import.meta.env.PROD 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use local server

export const APP_NAME = 'Estoque Gemini';
export const APP_VERSION = '1.0.0';
