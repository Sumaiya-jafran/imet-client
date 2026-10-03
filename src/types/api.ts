export interface ApiIssue {
  path: string[];
  message: string;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiIssue[];
  timestamp: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
export interface HealthData {
  status: 'ready' | 'unavailable';
  database: 'connected' | 'disconnected';
}
