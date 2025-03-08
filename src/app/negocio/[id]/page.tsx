'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Business } from '@/lib/types/business';
import { getBusinessById, addReview } from '@/lib/firebase/firebaseUtils';
import ImageCarousel from '@/app/components/ImageCarousel';

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Fecha no disponible';
  
  try {
    let date: Date;
    // Handle Firestore Timestamp
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else {
      // Handle string or number timestamp
      date = new Date(timestamp);
      if (date.toString() === 'Invalid Date') {
        return 'Fecha no disponible';
      }
    }
    
    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha no disponible';
  }
};

const REVIEW_TAGS = {
  positive: [
    'Delicioso',
    'Excelente servicio',
    'Buena calidad',
    'Buen precio',
    'Recomendado',
    'Limpio',
    'Amable atención',
    'Cumplido'
  ],
  negative: [
    'Necesita mejorar',
    'Servicio lento',
    'Precio alto',
    'Mala atención',
    'No recomendado'
  ]
};

export default function BusinessDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadBusiness = useCallback(async () => {
    try {
      const data = await getBusinessById(id as string);
      setBusiness({
        ...data,
        reviews: data?.reviews || []
      });
    } catch (err) {
      setError('Error al cargar el negocio');
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || selectedTags.length === 0) return;

    setSubmittingReview(true);
    try {
      await addReview(business.id, user.uid, rating, selectedTags);
      const updatedBusiness = await getBusinessById(business.id);
      setBusiness(updatedBusiness);
      setSelectedTags([]);
      setRating(5);
    } catch (err) {
      console.error('Error submitting review:', err);
      // Show error message to user
      alert(err instanceof Error ? err.message : 'Error al enviar la calificación');
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Error al cargar el negocio
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-20">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-5 w-5 ${
                    i < business.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {business.reviews.length} reseñas
            </span>
          </div>
        </div>
        {user && user.uid === business.ownerId && (
          <button
            onClick={() => router.push(`/negocio/${business.id}/editar-negocio`)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Editar Negocio
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ImageCarousel images={business.images} businessName={business.name} />

          <div className="mt-6 prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900">Descripción</h2>
            <p className="mt-2 text-gray-600">{business.description}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
            <p className="mt-2 text-gray-600">
              {business.location.isNational 
                ? 'Cobertura Nacional'
                : `${business.location.province}, ${business.location.city}`
              }
            </p>
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h2>
            <div className="space-y-4">
              {business.contactInfo.whatsapp && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">WhatsApp</h3>
                  <a
                    href={`https://wa.me/${business.contactInfo.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {business.contactInfo.whatsapp}
                  </a>
                </div>
              )}
              
              {business.contactInfo.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <a
                    href={`mailto:${business.contactInfo.email}`}
                    className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {business.contactInfo.email}
                  </a>
                </div>
              )}
              
              {business.contactInfo.instagram && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Instagram</h3>
                  <a
                    href={`https://instagram.com/${business.contactInfo.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{business.contactInfo.instagram}
                  </a>
                </div>
              )}
            </div>
          </div>

          {user && user.uid !== business.ownerId ? (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Calificar Negocio
              </h2>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Calificación
                  </label>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`h-6 w-6 ${
                          i < rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => setRating(i + 1)}
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Aspectos Positivos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_TAGS.positive.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTags.includes(tag)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Aspectos a Mejorar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_TAGS.negative.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTags.includes(tag)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || selectedTags.length === 0}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar Calificación'}
                </button>
              </form>
            </div>
          ) : user && user.uid === business.ownerId ? (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <div className="text-center text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="mt-2">No puedes calificar tu propio negocio</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <div className="text-center text-gray-600">
                <p>Inicia sesión para calificar este negocio</p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Calificaciones</h2>
            <div className="space-y-4">
              {business?.reviews?.length > 0 ? (
                business.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white shadow rounded-lg p-4"
                  >
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(review.tags || []).map((tag, index) => {
                        const isPositive = REVIEW_TAGS.positive.includes(tag?.trim() || '');
                        const isNegative = REVIEW_TAGS.negative.includes(tag?.trim() || '');
                        return (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-sm font-medium
                              ${isPositive ? 'bg-green-100 text-green-800' : 
                                isNegative ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-700'}`}
                          >
                            {tag?.trim() || ''}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay calificaciones aún</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 