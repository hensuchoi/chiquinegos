'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function ProtectedRoute({ children, requireVerification = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && requireVerification && !user.emailVerified) {
      router.push('/mi-cuenta');
    }
  }, [loading, user, router, requireVerification]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || (requireVerification && !user.emailVerified)) {
    return null;
  }

  return <>{children}</>;
} 