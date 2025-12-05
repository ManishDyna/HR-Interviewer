'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stopLoading } = useLoading();

  useEffect(() => {
    // Stop loading when navigation completes
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  return null;
}

