'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/app/components/Toast';
import Link from 'next/link';

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, signOut, sendEmailVerification } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<number | null>(null);

  useEffect(() => {
    if (user && !user.emailVerified) {
      showToast('Debes verificar tu email para acceder a ciertas funciones', 'warning');
    }
  }, [user, showToast]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push('/');
    } catch (error) {
      setError('Error al cerrar sesión. Por favor intente de nuevo.');
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      // Check if we're within the rate limit (2 minutes)
      if (lastVerificationTime && Date.now() - lastVerificationTime < 120000) {
        const remainingTime = Math.ceil((120000 - (Date.now() - lastVerificationTime)) / 1000);
        showToast(`Por favor espere ${remainingTime} segundos antes de solicitar otro correo de verificación`, 'warning');
        return;
      }

      setIsVerifying(true);
      setError('');
      
      if (!user) {
        throw new Error('No hay usuario conectado');
      }

      await sendEmailVerification();
      setVerificationSent(true);
      setLastVerificationTime(Date.now());
      showToast('Correo de verificación enviado. Por favor revise su bandeja de entrada y la carpeta de spam.', 'success');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      let errorMessage = 'Error al enviar el correo de verificación. ';
      
      if (error.message === 'No hay usuario conectado') {
        errorMessage = 'Debes iniciar sesión para verificar tu email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Has enviado demasiadas solicitudes. Por favor espera unos minutos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'El correo electrónico no es válido.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage += 'Usuario no encontrado.';
      } else {
        errorMessage += 'Por favor intente de nuevo más tarde.';
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Cuenta</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID de Usuario
              </label>
              <p className="mt-1 text-sm text-gray-900">{user.uid}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cuenta Verificada
              </label>
              <p className="mt-1 text-sm">
                {user.emailVerified ? (
                  <span className="text-green-600">Verificada</span>
                ) : (
                  <span className="text-yellow-600">No verificada</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Registro
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('es-EC', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones de Cuenta</h2>
          
          {!user.emailVerified && (
            <div className="flex items-center justify-between py-3 px-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="ml-3 text-sm text-yellow-700">
                  {verificationSent 
                    ? 'Correo de verificación enviado. Por favor revise su bandeja de entrada.'
                    : 'Tu correo electrónico no está verificado'}
                </span>
              </div>
              <button
                onClick={handleVerifyEmail}
                disabled={isVerifying || verificationSent}
                className={`ml-4 px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                  verificationSent
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {isVerifying ? 'Enviando...' : verificationSent ? 'Enviado' : 'Verificar'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-blue-700">
                Comienza a ofrecer tus servicios{' '}
                <Link 
                  href="/crear-negocio"
                  className="font-medium underline hover:text-blue-800 transition-colors"
                >
                  creando tu primer negocio
                </Link>
              </p>
            </div>

            <button
              onClick={() => router.push('/mi-negocio')}
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span>Gestionar Mi Negocio</span>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/mis-reviews')}
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span>Mis Reseñas</span>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 