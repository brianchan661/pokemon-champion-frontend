import axios from 'axios';
import { Team, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { authService } from './authService';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

interface MyTeamsResponse {
  teams: Team[];
  count: number;
  limit: number;
}

interface TeamResponse {
  team: Team;
  hasLiked: boolean;
}

class TeamService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getMyTeams(): Promise<ApiResponse<MyTeamsResponse>> {
    try {
      const response = await axios.get<ApiResponse<MyTeamsResponse>>(
        `${API_BASE}/teams/my`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch your teams'
      };
    }
  }

  async getTeamById(id: string): Promise<ApiResponse<TeamResponse>> {
    try {
      const response = await axios.get<ApiResponse<TeamResponse>>(
        `${API_BASE}/teams/${id}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch team'
      };
    }
  }

  async deleteTeam(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axios.delete<ApiResponse<{ message: string }>>(
        `${API_BASE}/teams/${id}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete team'
      };
    }
  }

  async toggleTeamVisibility(id: string, isPublic: boolean): Promise<ApiResponse<Team>> {
    try {
      const response = await axios.put<ApiResponse<Team>>(
        `${API_BASE}/teams/${id}`,
        { isPublic },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update team visibility'
      };
    }
  }
}

export const teamService = new TeamService();
