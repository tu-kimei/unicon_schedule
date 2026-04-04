import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const CUSTOMER_ROLES = ['CUSTOMER_OWNER', 'CUSTOMER_OPS'];

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;

    if (!allowedRoles.includes(user.role)) {
      // Redirect based on user type
      if (CUSTOMER_ROLES.includes(user.role)) {
        navigate('/customer', { replace: true });
      } else if (user.role === 'DRIVER') {
        navigate('/driver', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, isLoading, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
