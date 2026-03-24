import { ApiResponse } from '../types/api';

const BASE_URL = '/api/v1';

export interface ApiError extends Error {
  code: string;
  status: number;
}

class ApiClient {
  private baseUrl = BASE_URL;

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    // 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 401 인증 에러 발생 시 토큰 리프레시 시도
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // 리프레시 성공 시 재요청
        return this.request<T>(method, endpoint, body);
      } else {
        // 리프레시 실패 시 (만료된 리프레시 토큰 등)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        const error = new Error('인증이 만료되었습니다.') as ApiError;
        error.code = 'AUTHENTICATION_REQUIRED';
        error.status = 401;
        throw error;
      }
    }

    const contentType = response.headers.get('content-type');
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(typeof data === 'object' && data.message ? data.message : '요청 처리에 실패했습니다.') as ApiError;
      error.code = typeof data === 'object' ? (data.code || 'UNKNOWN') : 'UNKNOWN';
      error.status = response.status;
      throw error;
    }

    // data가 { data: T, ... } 구조일 경우 data.data 반환, 아니면 data 전체 반환
    return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      // 백엔드 사양(@RequestParam)에 맞추어 쿼리 스트링으로 전달
      const response = await fetch(`${this.baseUrl}/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return false;

      const resData = await response.json();
      // resData가 ApiResponse 구조일 수 있으므로 유연하게 대응
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? resData.data : resData;

      if (data && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('토큰 리프레시 실패:', err);
      return false;
    }
  }

  public get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  public post<T>(endpoint: string, body?: any) {
    return this.request<T>('POST', endpoint, body);
  }

  public put<T>(endpoint: string, body?: any) {
    return this.request<T>('PUT', endpoint, body);
  }

  public patch<T>(endpoint: string, body?: any) {
    return this.request<T>('PATCH', endpoint, body);
  }

  public delete<T>(endpoint: string, body?: any) {
    return this.request<T>('DELETE', endpoint, body);
  }
}

export const api = new ApiClient();

