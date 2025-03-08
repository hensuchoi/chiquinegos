'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const Navigation = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const navItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Mi Negocio', path: '/mi-negocio', authRequired: true },
    { label: 'Crear Negocio', path: '/crear-negocio', authRequired: true },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Only trigger search on home page
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('search', { detail: searchTerm }));
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation Bar */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Left section: Menu and Logo */}
            <div className="flex items-center flex-shrink-0">
              {/* Hamburger Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
                  aria-expanded={isMenuOpen}
                  aria-label="Menu principal"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                    {/* User Info Section */}
                    {user && (
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        {user.email}
                      </div>
                    )}

                    {/* Navigation Items */}
                    {navItems.map((item) => {
                      if (item.authRequired && !user) return null;
                      
                      const isActive = pathname === item.path;
                      
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-4 py-2 text-sm ${
                            isActive
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}

                    {/* Account Actions */}
                    {user ? (
                      <>
                        <div className="border-t border-gray-200">
                          <Link
                            href="/mi-cuenta"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Mi Cuenta
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Cerrar Sesión
                          </button>
                        </div>
                      </>
                    ) : (
                      <Link
                        href="/auth"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Ingresar
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Logo/Home Link */}
              <Link href="/" className="text-xl font-bold text-blue-600 whitespace-nowrap ml-3">
                ChiquiNegos
              </Link>
            </div>

            {/* Desktop Search */}
            <div className="hidden sm:flex items-center ml-4 flex-1 max-w-xs">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full px-3 py-1.5 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="sm:hidden ml-auto p-2 text-gray-600 hover:text-blue-600"
              aria-label="Buscar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchVisible && (
          <div className="sm:hidden border-t border-gray-200 px-4 py-2">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar servicios..."
                  className="w-full px-3 py-1.5 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="search"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 