export type UserRole =
  | 'BUYER'
  | 'LOCAL_SUPPLIER'
  | 'INTERNATIONAL_MANUFACTURER'
  | 'SALES_PERSON'
  | 'INDEPENDENT_SELLER'
  | 'ADMIN';
export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  isEmailVerified: boolean;
}
export interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
