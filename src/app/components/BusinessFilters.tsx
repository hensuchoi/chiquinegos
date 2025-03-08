'use client';

import { useState, useEffect } from 'react';
import { provinces } from '@/lib/data/ecuadorLocations';

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

const QUICK_FILTERS = {
  categories: [
    { id: 'alimentos', name: 'Alimentos y Bebidas' },
    { id: 'servicios', name: 'Servicios Profesionales' },
  ],
  cities: [
    { province: 'Pichincha', city: 'Quito' },
    { province: 'Guayas', city: 'Guayaquil' },
    { province: 'Azuay', city: 'Cuenca' },
  ]
};

interface BusinessFiltersProps {
  onFilterChange: (filters: { category: string; province: string; city: string }) => void;
}

export default function BusinessFilters({ onFilterChange }: BusinessFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get all cities from the selected province
  const availableCities = selectedProvince 
    ? provinces.find(p => p.name === selectedProvince)?.cities.map(c => c.name) || []
    : [];

  // Get all unique provinces
  const uniqueProvinces = provinces.map(p => p.name);

  const handleCategoryChange = (category: string) => {
    // Toggle category off if it's already selected
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    onFilterChange({
      category: newCategory,
      province: selectedProvince,
      city: selectedCity
    });
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity(''); // Reset city when province changes
    onFilterChange({
      category: selectedCategory,
      province,
      city: ''
    });
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    onFilterChange({
      category: selectedCategory,
      province: selectedProvince,
      city
    });
  };

  const handleQuickCityFilter = (province: string, city: string) => {
    // Toggle city/province off if the same city is already selected
    if (selectedCity === city) {
      setSelectedProvince('');
      setSelectedCity('');
      onFilterChange({
        category: selectedCategory,
        province: '',
        city: ''
      });
    } else {
      setSelectedProvince(province);
      setSelectedCity(city);
      onFilterChange({
        category: selectedCategory,
        province,
        city
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedProvince('');
    setSelectedCity('');
    onFilterChange({
      category: '',
      province: '',
      city: ''
    });
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category Quick Filters */}
        {QUICK_FILTERS.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCategory === cat.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {cat.name}
          </button>
        ))}

        {/* City Quick Filters */}
        {QUICK_FILTERS.cities.map((loc) => (
          <button
            key={loc.city}
            onClick={() => handleQuickCityFilter(loc.province, loc.city)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCity === loc.city
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {loc.city}
          </button>
        ))}
      </div>

      {/* Main Filters Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Más Filtros
        </span>
        <svg className={`w-5 h-5 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todas las categorías</option>
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <select
                id="province"
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todas las provincias</option>
                {uniqueProvinces.map(province => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!selectedProvince}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Todas las ciudades</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || selectedProvince || selectedCity) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 