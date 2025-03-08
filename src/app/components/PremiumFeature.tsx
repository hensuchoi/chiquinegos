import { ReactNode } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useRouter } from 'next/navigation';

interface PremiumFeatureProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PremiumFeature({ feature, children, fallback }: PremiumFeatureProps) {
  const { hasFeature, loading, subscriptionType } = useSubscription();
  const router = useRouter();

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Función Premium
      </h3>
      <p className="text-gray-600 mb-4">
        Esta función está disponible para usuarios {subscriptionType === 'free' ? 'Premium y Business' : 'Business'}.
        Actualiza tu plan para acceder a todas las funciones.
      </p>
      <button
        onClick={() => router.push('/planes')}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Ver Planes
      </button>
    </div>
  );
} 