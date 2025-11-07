import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Team, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { authService } from './authService';

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
} as const;

const API_BASE = `${API_CONFIG.BASE_URL}/api/teams`;

// Error messages (should be moved to constants file for i18n)
const ERROR_MESSAGES = {
  FETCH_TEAMS: 'Failed to fetch your teams',
  FETCH_TEAM: 'Failed to fetch team',
  DELETE_TEAM: 'Failed to delete team',
  UPDATE_VISIBILITY: 'Failed to update team visibility',
  INVALID_ID: 'Invalid team ID provided',
  INVALID_VISIBILITY: 'Invalid visibility value',
} as const;

// Response interfaces
interface MyTeamsResponse {
  teams: Team[];
  count: number;
  limit: number;
}

interface TeamResponse {
  team: Team;
  hasLiked: boolean;
}

/**
 * Service for managing Pokemon teams
 * Handles all team-related API calls with proper error handling and validation
 */
class TeamService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE,
      timeout: API_CONFIG.TIMEOUT,
    });

    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for global error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
          authService.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic request handler with consistent error handling
   */
  private async handleRequest<T>(
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
    errorMessage: string
  ): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      this.logError(errorMessage, error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || errorMessage
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validates team ID parameter
   */
  private validateTeamId(id: string): string | null {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return ERROR_MESSAGES.INVALID_ID;
    }
    return null;
  }

  /**
   * Logs errors in development mode
   */
  private logError(message: string, error: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[TeamService] ${message}:`, error);
    }
  }

  /**
   * Fetches all teams belonging to the authenticated user
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getMyTeams(signal?: AbortSignal): Promise<ApiResponse<MyTeamsResponse>> {
    return this.handleRequest(
      () => this.axiosInstance.get<ApiResponse<MyTeamsResponse>>(
        '/my',
        { signal }
      ),
      ERROR_MESSAGES.FETCH_TEAMS
    );
  }

  /**
   * Fetches a single team by ID
   * @param id - Team ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getTeamById(id: string, signal?: AbortSignal): Promise<ApiResponse<TeamResponse>> {
    const validationError = this.validateTeamId(id);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.handleRequest(
      () => this.axiosInstance.get<ApiResponse<TeamResponse>>(
        `/${id.trim()}`,
        { signal }
      ),
      ERROR_MESSAGES.FETCH_TEAM
    );
  }

  /**
   * Deletes a team by ID
   * @param id - Team ID to delete
   */
  async deleteTeam(id: string): Promise<ApiResponse<{ message: string }>> {
    const validationError = this.validateTeamId(id);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    return this.handleRequest(
      () => this.axiosInstance.delete<ApiResponse<{ message: string }>>(
        `/${id.trim()}`
      ),
      ERROR_MESSAGES.DELETE_TEAM
    );
  }

  /**
   * Toggles team visibility between public and private
   * @param id - Team ID
   * @param isPublic - New visibility state
   */
  async toggleTeamVisibility(id: string, isPublic: boolean): Promise<ApiResponse<Team>> {
    const validationError = this.validateTeamId(id);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    if (typeof isPublic !== 'boolean') {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_VISIBILITY
      };
    }

    return this.handleRequest(
      () => this.axiosInstance.put<ApiResponse<Team>>(
        `/${id.trim()}`,
        { isPublic }
      ),
      ERROR_MESSAGES.UPDATE_VISIBILITY
    );
  }
}

export const teamService = new TeamService();
