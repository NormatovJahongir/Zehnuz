export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface SessionUser {
  userId: number;
  username: string;
  role: Role;
  centerId?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface CenterStats {
  subjectsCount: number;
  teachersCount: number;
  studentsCount: number;
  coursesCount: number;
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface DashboardStats {
  centersCount: number;
  studentsCount: number;
  teachersCount: number;
  totalRevenue: number;
}
