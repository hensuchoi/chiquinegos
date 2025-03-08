'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getBusinessById } from '@/lib/firebase/firebaseUtils';
import BusinessEditForm from '@/app/components/BusinessEditForm';
import type { Business } from '@/lib/types/business';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

export default function EditBusinessPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const businessData = await getBusinessById(params.id);
        if (!businessData) {
          setError('Negocio no encontrado');
          return;
        }
        setBusiness(businessData);
      } catch (err) {
        console.error('Error loading business:', err);
        setError('Error al cargar el negocio');
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [params.id]);

  // Check ownership
  useEffect(() => {
    if (!loading && business && business.ownerId !== user?.uid) {
      router.push(`/negocio/${params.id}`);
    }
  }, [loading, business, user, router, params.id]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 rounded-lg">
        <h1 className="text-xl font-semibold text-red-700">{error}</h1>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <ProtectedRoute requireVerification>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Editar {business.name}
        </h1>
        <BusinessEditForm
          business={business}
          onSuccess={() => {
            router.push(`/negocio/${business.id}`);
          }}
        />
      </div>
    </ProtectedRoute>
  );
} 