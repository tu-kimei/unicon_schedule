import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const CUSTOMER_ROLES = ['CUSTOMER_OWNER', 'CUSTOMER_OPS'];

export const AuthRedirectPage = () => {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;

    if (CUSTOMER_ROLES.includes(user.role)) {
      navigate('/customer', { replace: true });
    } else if (user.role === 'DRIVER') {
      navigate('/driver', { replace: true });
    } else if (user.role === 'DISPATCHER') {
      navigate('/dispatcher', { replace: true });
    } else {
      navigate('/ops/shipments', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-600 mt-4">Dang chuyen huong...</p>
      </div>
    </div>
  );
};
