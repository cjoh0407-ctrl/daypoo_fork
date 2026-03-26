import { ApiResponse } from '../types/api';

const BASE_URL = '/api/v1';

export interface ApiError extends Error {
  code: string;
  status: number;
}

class ApiClient {
  private baseUrl = BASE_URL;
  private refreshPromise: Promise<boolean> | null = null; // F3: 토큰 리프레시 뮤텍스

  private async request<T>(method: string, endpoint: string, body?: any, timeout: number = 30000): Promise<T> {
    const token = localStorage.getItem('accessToken');

    // 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json; charset=UTF-8',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // F1: AbortController 기반 타임아웃
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 401 인증 에러 발생 시 토큰 리프레시 시도
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // 리프레시 성공 시 재요청
          return this.request<T>(method, endpoint, body, timeout);
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
    } catch (err: any) {
      clearTimeout(timeoutId);

      // AbortError 처리 (타임아웃)
      if (err.name === 'AbortError') {
        const timeoutError = new Error('요청 시간이 초과되었습니다.') as ApiError;
        timeoutError.code = 'TIMEOUT';
        timeoutError.status = 408;
        throw timeoutError;
      }

      // 네트워크 에러
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const networkError = new Error('네트워크 연결에 실패했습니다.') as ApiError;
        networkError.code = 'NETWORK_ERROR';
        networkError.status = 0;
        throw networkError;
      }

      throw err;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    // F3: 뮤텍스 패턴 - 이미 리프레시 중이면 기존 Promise 재사용
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<boolean> {
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

  // F2: 지수 백오프 재시도 래퍼
  private async requestWithRetry<T>(
    method: string,
    endpoint: string,
    body?: any,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    // 재시도하지 않아야 하는 엔드포인트
    const noRetryEndpoints = ['/auth/login', '/auth/signup', '/auth/refresh'];
    const shouldSkipRetry = noRetryEndpoints.some(path => endpoint.includes(path));

    if (shouldSkipRetry) {
      // 로그인/회원가입 등은 재시도하지 않음
      return this.request<T>(method, endpoint, body);
    }

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(method, endpoint, body);
      } catch (error: any) {
        lastError = error;

        // 재시도하지 않아야 하는 경우
        const shouldNotRetry =
          error.status === 401 || // 인증 에러 (이미 처리됨)
          error.status === 403 || // 권한 에러
          error.status === 404 || // Not Found
          error.status === 400 || // Bad Request
          error.status === 422 || // Validation Error
          error.status === 429 || // Too Many Requests (Rate Limit)
          error.code === 'AUTHENTICATION_REQUIRED';

        if (shouldNotRetry || attempt === maxRetries) {
          throw error;
        }

        // 재시도 가능한 에러 (5xx, 네트워크, 타임아웃)
        const shouldRetry =
          error.status >= 500 ||
          error.code === 'NETWORK_ERROR' ||
          error.code === 'TIMEOUT';

        if (!shouldRetry) {
          throw error;
        }

        // 지수 백오프
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`재시도 ${attempt + 1}/${maxRetries} (${delay}ms 후)`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  public get<T>(endpoint: string) {
    return this.requestWithRetry<T>('GET', endpoint);
  }

  public post<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('POST', endpoint, body);
  }

  public put<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('PUT', endpoint, body);
  }

  public patch<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('PATCH', endpoint, body);
  }

  public delete<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('DELETE', endpoint, body);
  }
}

export const api = new ApiClient();

