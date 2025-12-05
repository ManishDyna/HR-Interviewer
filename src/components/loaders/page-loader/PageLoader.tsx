'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import LoaderWithLogo from '../loader-with-logo/loaderWithLogo';

export const PageLoader: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <LoaderWithLogo />
    </div>
  );
};

export default PageLoader;

