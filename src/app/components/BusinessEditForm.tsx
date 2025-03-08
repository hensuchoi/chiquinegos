import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Business } from '@/lib/types/business';
import { updateBusiness } from '@/lib/firebase/firebaseUtils';
import { uploadBusinessImage } from '@/lib/firebase/storageUtils';
import { useAuth } from '@/lib/hooks/useAuth';
import { provinces, type Province, type City } from '@/lib/data/ecuadorLocations';

interface BusinessEditFormProps {
  business: Business;
  onSuccess?: () => void;
}

interface ImageUpload {
  file: File;
  preview: string;
  isMain: boolean;
  isUploading?: boolean;
  progress?: number;
}

const BUSINESS_CATEGORIES = [
  { id: 'alimentos', name: 'Alimentos y Bebidas' },
  { id: 'ropa', name: 'Ropa y Accesorios' },
  { id: 'artesanias', name: 'Artesanías' },
  { id: 'servicios', name: 'Servicios Profesionales' },
  { id: 'belleza', name: 'Belleza y Cuidado Personal' },
  { id: 'tecnologia', name: 'Tecnología' },
  { id: 'hogar', name: 'Hogar y Decoración' },
  { id: 'mascotas', name: 'Mascotas' },
  { id: 'deportes', name: 'Deportes y Fitness' },
  { id: 'educacion', name: 'Educación y Cursos' },
  { id: 'eventos', name: 'Eventos y Entretenimiento' },
  { id: 'otros', name: 'Otros' }
];

const validateInstagramUsername = (username: string): string | null => {
  if (!username) return null; // Optional field
  
  // Instagram username rules:
  // - 1-30 characters
  // - Can contain letters, numbers, periods, and underscores
  // - Cannot start or end with a period
  // - Cannot have consecutive periods
  const regex = /^[a-zA-Z0-9_][a-zA-Z0-9_.]*[a-zA-Z0-9_]$|^[a-zA-Z0-9_]$/;
  
  if (username.length > 30) {
    return 'El nombre de usuario no puede tener más de 30 caracteres';
  }
  
  if (username.includes('..')) {
    return 'El nombre de usuario no puede contener puntos consecutivos';
  }
  
  if (!regex.test(username)) {
    return 'El nombre de usuario solo puede contener letras, números, puntos y guiones bajos';
  }
  
  return null;
};

export default function BusinessEditForm({ business, onSuccess }: BusinessEditFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description,
    category: business.category,
    location: business.location,
    contactInfo: {
      instagram: business.contactInfo.instagram || '',
      email: business.contactInfo.email || '',
      whatsapp: business.contactInfo.whatsapp || ''
    }
  });

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(() => {
    if (business.location.isNational) return null;
    return provinces.find(p => p.name === business.location.province) || null;
  });

  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    if (business.location.isNational) return null;
    return selectedProvince?.cities.find(c => c.name === business.location.city) || null;
  });
  
  const [currentImages, setCurrentImages] = useState<Array<{ url: string; isMain: boolean }>>(
    business.images.map((url, index) => ({
      url,
      isMain: index === 0 // Assuming first image is main
    }))
  );
  
  const [newImages, setNewImages] = useState<ImageUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    instagram?: string;
  }>({});

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      newImages.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [newImages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newUploads = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isMain: false,
    }));

    setNewImages(prev => [...prev, ...newUploads]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => {
      const newArray = [...prev];
      URL.revokeObjectURL(newArray[index].preview);
      newArray.splice(index, 1);
      return newArray;
    });
  };

  const handleRemoveCurrentImage = (index: number) => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleMainImageChange = (type: 'current' | 'new', index: number) => {
    if (type === 'current') {
      setCurrentImages(prev => prev.map((img, i) => ({
        ...img,
        isMain: i === index
      })));
      setNewImages(prev => prev.map(img => ({
        ...img,
        isMain: false
      })));
    } else {
      setNewImages(prev => prev.map((img, i) => ({
        ...img,
        isMain: i === index
      })));
      setCurrentImages(prev => prev.map(img => ({
        ...img,
        isMain: false
      })));
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = provinces.find(p => p.id === e.target.value) || null;
    setSelectedProvince(province);
    setSelectedCity(null);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        province: province?.name || '',
        city: ''
      }
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = selectedProvince?.cities.find(c => c.id === e.target.value) || null;
    setSelectedCity(city);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city: city?.name || ''
      }
    }));
  };

  const handleInstagramChange = (value: string) => {
    const error = validateInstagramUsername(value);
    setValidationErrors(prev => ({
      ...prev,
      instagram: error
    }));
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        instagram: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate Instagram before submitting
    const instagramError = validateInstagramUsername(formData.contactInfo.instagram);
    if (instagramError) {
      setValidationErrors(prev => ({
        ...prev,
        instagram: instagramError
      }));
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // Upload new images
      const uploadedUrls = await Promise.all(
        newImages.map(async (image) => {
          const url = await uploadBusinessImage(
            image.file,
            business.id,
            ({ progress }) => {
              setNewImages(prev =>
                prev.map(img =>
                  img === image ? { ...img, progress } : img
                )
              );
            }
          );
          return { url, isMain: image.isMain };
        })
      );

      // Combine current and new images, ensuring main image is first
      const allImages = [...currentImages, ...uploadedUrls];
      const mainImage = allImages.find(img => img.isMain);
      const otherImages = allImages.filter(img => !img.isMain);
      const orderedImages = mainImage 
        ? [mainImage.url, ...otherImages.map(img => img.url)]
        : allImages.map(img => img.url);

      // Update business
      await updateBusiness(business.id, {
        ...formData,
        images: orderedImages,
      });

      onSuccess?.();
      router.push(`/negocio/${business.id}`);
    } catch (err) {
      console.error('Error updating business:', err);
      setError('Error al actualizar el negocio. Por favor intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre del Negocio
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar Categoría</option>
            {BUSINESS_CATEGORIES.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación
          </label>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isNational"
              checked={formData.location.isNational}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  isNational: e.target.checked,
                  province: e.target.checked ? '' : prev.location.province,
                  city: e.target.checked ? '' : prev.location.city
                }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isNational" className="ml-2 block text-sm text-gray-900">
              Cobertura Nacional
            </label>
          </div>

          {!formData.location.isNational && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                  Provincia
                </label>
                <select
                  id="province"
                  required
                  value={selectedProvince?.id || ''}
                  onChange={handleProvinceChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Provincia</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <select
                  id="city"
                  required
                  value={selectedCity?.id || ''}
                  onChange={handleCityChange}
                  disabled={!selectedProvince}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Ciudad</option>
                  {selectedProvince?.cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
              WhatsApp *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">+593</span>
              </div>
              <input
                type="tel"
                id="whatsapp"
                required
                value={formData.contactInfo.whatsapp}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, whatsapp: e.target.value }
                }))}
                className="block w-full pl-12 pr-3 py-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="912345678"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ingresa un número de WhatsApp de Ecuador (9 dígitos sin el 0 inicial)
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (opcional)
            </label>
            <input
              type="email"
              id="email"
              value={formData.contactInfo.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contactInfo: { ...prev.contactInfo, email: e.target.value }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ejemplo@email.com"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
              Instagram (opcional)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">@</span>
              </div>
              <input
                type="text"
                id="instagram"
                value={formData.contactInfo.instagram}
                onChange={(e) => handleInstagramChange(e.target.value)}
                className={`block w-full pl-8 pr-3 py-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  validationErrors.instagram 
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                    : ''
                }`}
                placeholder="username"
                aria-invalid={!!validationErrors.instagram}
                aria-describedby={validationErrors.instagram ? "instagram-error" : undefined}
              />
            </div>
            {validationErrors.instagram && (
              <p className="mt-2 text-sm text-red-600" id="instagram-error">
                {validationErrors.instagram}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes Actuales
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentImages.map((image, index) => (
              <div key={image.url} className="relative">
                <div className="relative group">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={image.url}
                      alt={`Business image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      quality={75}
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveCurrentImage(index)}
                      className="text-white bg-red-600 p-2 rounded-full hover:bg-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={image.isMain}
                      onChange={() => handleMainImageChange('current', index)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Imagen Principal</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar Nuevas Imágenes
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {newImages.map((image, index) => (
              <div key={index} className="relative">
                <div className="relative group">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={image.preview}
                      alt={`New image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      quality={75}
                      className="object-cover rounded-lg"
                    />
                    {image.progress !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white">{Math.round(image.progress)}%</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="text-white bg-red-600 p-2 rounded-full hover:bg-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={image.isMain}
                      onChange={() => handleMainImageChange('new', index)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Imagen Principal</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
} 