'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BusinessFormData } from '@/lib/types/business';
import { createBusiness } from '@/lib/firebase/firebaseUtils';
import { provinces, type Province, type City } from '@/lib/data/ecuadorLocations';
import Image from 'next/image';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { useToast } from '@/app/components/Toast';

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

export default function CreateBusinessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    location: {
      isNational: false,
      province: '',
      city: ''
    },
    contactInfo: {
      email: '',
      instagram: '',
      whatsapp: ''
    },
    images: []
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Update formData with the selected images
      const updatedFormData = {
        ...formData,
        images: imageFiles
      };

      const businessId = await createBusiness(
        updatedFormData,
        user.uid,
        ({ progress }) => {
          // Handle progress if needed
          console.log('Upload progress:', progress);
        }
      );

      showToast('Negocio creado exitosamente', 'success');
      router.push(`/negocio/${businessId}`);
    } catch (err) {
      console.error('Error creating business:', err);
      setError('Error al crear el negocio. Por favor intente de nuevo.');
      showToast('Error al crear el negocio', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Inicia sesión para crear un negocio
        </h2>
      </div>
    );
  }

  return (
    <ProtectedRoute requireVerification>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Crear Nuevo Negocio
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Categoría *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              Ubicación *
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

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
            
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, instagram: e.target.value }
                  }))}
                  className="block w-full pl-8 pr-3 py-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes *
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              required={imageFiles.length === 0}
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Sube al menos una imagen de tu negocio
            </p>

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="relative group">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        quality={75}
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Negocio'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
