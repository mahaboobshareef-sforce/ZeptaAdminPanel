import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../config/permissions';
import { Card, CardContent, CardHeader, CardTitle } from './UI/Card';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  permission,
  fallback,
}: ProtectedRouteProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-center text-sm text-gray-500">
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
