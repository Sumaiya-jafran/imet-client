import { config } from '@/config/env';
import type { ApiResponse } from '@/types/api';
export class ApiError extends Error {
  constructor(
    public status: number,
    public response: ApiResponse<unknown>,
  ) {
    super(response.message);
    this.name = 'ApiError';
  }
}
class ApiClient {
  constructor(private baseURL: string) {}
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });
    let body: ApiResponse<T>;
    try {
      body = await response.json();
    } catch {
      throw new ApiError(response.status, {
        success: false,
        message: 'The server returned an invalid response.',
        timestamp: new Date().toISOString(),
      });
    }
    if (!response.ok || !body.success)
      throw new ApiError(response.status, body);
    return body;
  }
  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, options);
  }
  post<T>(endpoint: string, body: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
export const apiClient = new ApiClient(config.NEXT_PUBLIC_BACKEND_API_URL);
