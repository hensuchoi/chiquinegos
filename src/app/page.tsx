'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Business } from '@/lib/types/business';
import { searchBusinesses } from '@/lib/firebase/firebaseUtils';
import BusinessFilters from '@/app/components/BusinessFilters';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastDocRef = useRef<any>(null);
  const router = useRouter();
  const [filters, setFilters] = useState({
    category: '',
    province: '',
    city: ''
  });

  // Load all businesses when component mounts or filters change
  useEffect(() => {
    lastDocRef.current = null;
    setHasMore(true);
    loadBusinesses();
  }, [filters]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for search events from the navigation
  useEffect(() => {
    const handleSearch = (e: CustomEvent) => {
      setSearchTerm(e.detail);
      lastDocRef.current = null;
      setHasMore(true);
      loadBusinesses(e.detail);
    };

    window.addEventListener('search', handleSearch as EventListener);
    return () => window.removeEventListener('search', handleSearch as EventListener);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const loadBusinesses = async (term?: string, isLoadingMore: boolean = false) => {
    if (!isLoadingMore) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await searchBusinesses(
        term,
        isLoadingMore ? lastDocRef.current : undefined,
        12,
        filters
      );

      if (!isLoadingMore) {
        setBusinesses(result.businesses);
      } else {
        setBusinesses(prev => [...prev, ...result.businesses]);
      }

      lastDocRef.current = result.lastDoc;
      setHasMore(result.businesses.length === 12); // 12 is our pageSize
    } catch (error) {
      console.error('Error loading businesses:', error);
      setError('Error al cargar los negocios. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollThreshold = document.documentElement.scrollHeight - 800; // Load more when 800px from bottom

    if (scrollPosition > scrollThreshold) {
      loadBusinesses(searchTerm, true);
    }
  }, [loadingMore, hasMore, searchTerm]);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleFilterChange = (newFilters: { category: string; province: string; city: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-8 pt-24 sm:pt-20">
      <BusinessFilters onFilterChange={handleFilterChange} />

      {error && (
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg max-w-3xl mx-auto">
          <h2 className="text-xl font-medium text-gray-900">
            No se encontraron negocios
          </h2>
          <p className="mt-2 text-gray-600">
            {searchTerm || filters.category || filters.province || filters.city
              ? 'Intenta con otros términos de búsqueda o filtros'
              : 'Sé el primero en registrar tu negocio'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                onClick={() => router.push(`/negocio/${business.id}`)}
              >
                {business.images[0] && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={business.images[0]}
                      alt={business.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={75}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {business.name}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {business.description.substring(0, 150)}
                    {business.description.length > 150 ? '...' : ''}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < business.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-gray-600">
                          {business.reviews.length} reseñas
                        </span>
                      </div>
                    </div>
                    <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {business.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loadingMore && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
