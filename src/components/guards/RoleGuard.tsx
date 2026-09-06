import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../store/authStore';

interface RoleGuardProps {
  /** If provided, only these roles can access the route */
  allowedRoles?: UserRole[];
}

/**
 * RoleGuard wraps protected routes.
 * - Unauthenticated users → /login
 * - Authenticated but wrong role → /unauthorized
 * - Correct role → renders <Outlet />
 */
export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
