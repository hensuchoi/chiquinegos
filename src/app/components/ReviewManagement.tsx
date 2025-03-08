'use client';

import { useState } from 'react';
import { Review } from '@/lib/types/business';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from './Toast';
import { respondToReview, flagReview, deleteReview } from '@/lib/firebase/firebaseUtils';

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

interface ReviewManagementProps {
  businessId: string;
  reviews: Review[];
  onReviewUpdate: () => void;
}

export function ReviewManagement({ businessId, reviews, onReviewUpdate }: ReviewManagementProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  // Commented out for future implementation
  // const [replyText, setReplyText] = useState('');
  // const [selectedReview, setSelectedReview] = useState<string | null>(null);
  // const [isSubmitting, setIsSubmitting] = useState(false);

  // const handleReply = async (reviewId: string) => {
  //   if (!replyText.trim()) return;
    
  //   setIsSubmitting(true);
  //   try {
  //     await respondToReview(businessId, reviewId, replyText.trim());
  //     showToast('Respuesta enviada con éxito', 'success');
  //     onReviewUpdate();
  //     setReplyText('');
  //     setSelectedReview(null);
  //   } catch (error) {
  //     console.error('Error replying to review:', error);
  //     showToast('Error al enviar la respuesta', 'error');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleFlagReview = async (reviewId: string, reason: string) => {
    try {
      await flagReview(businessId, reviewId, reason);
      showToast('Reseña marcada como inapropiada', 'success');
      onReviewUpdate();
    } catch (error) {
      console.error('Error flagging review:', error);
      showToast('Error al marcar la reseña', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      return;
    }

    try {
      await deleteReview(businessId, reviewId);
      showToast('Reseña eliminada con éxito', 'success');
      onReviewUpdate();
    } catch (error) {
      console.error('Error deleting review:', error);
      showToast('Error al eliminar la reseña', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Reseñas</h2>
        <div className="text-sm text-gray-600">
          {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
        </div>
      </div>
      
      {reviews.length === 0 ? (
        <p className="text-gray-600">No hay reseñas para mostrar.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {review.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFlagReview(review.id, 'inappropriate')}
                    className="text-gray-400 hover:text-red-500"
                    title="Marcar como inapropiada"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Eliminar reseña"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Response functionality commented out for future implementation */}
              {/*review.ownerResponse ? (
                <div className="mt-4 pl-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700">{review.ownerResponse.text}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Respondido el {formatDate(review.ownerResponse.createdAt)}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {selectedReview === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReview(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyText.trim() || isSubmitting}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Enviando...' : 'Responder'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedReview(review.id)}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Responder a esta reseña
                    </button>
                  )}
                </div>
              )*/}

              {review.flags && review.flags.count > 0 && (
                <div className="mt-2 text-xs text-red-500">
                  Marcada como inapropiada ({review.flags.count} veces)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 