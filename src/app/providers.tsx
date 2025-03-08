'use client';

import { AuthProvider } from '@/lib/contexts/AuthContext';
import Navigation from '@/app/components/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
} 