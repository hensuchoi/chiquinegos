'use client';

import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="brand-text text-2xl brand-gradient">
                Chiquinegos
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 