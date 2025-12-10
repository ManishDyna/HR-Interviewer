'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';
import { useInterviews } from '@/contexts/interviews.context';
import { useAssignees } from '@/contexts/users.context';
import { useInterviewers } from '@/contexts/interviewers.context';
import { useAuth } from '@/contexts/auth.context';

const MIN_LOADER_DISPLAY_TIME = 500; // Minimum time to show loader (ms)

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoading, stopLoading } = useLoading();
  const { isLoading: authLoading } = useAuth();
  
  // Get loading states from all contexts
  const { interviewsLoading } = useInterviews();
  const { assigneesLoading } = useAssignees();
  const { interviewersLoading } = useInterviewers();
  
  const prevPathRef = useRef(pathname);
  const loadingStartTimeRef = useRef<number | null>(null);
  const [canStopLoading, setCanStopLoading] = useState(false);

  // Track when loading started
  useEffect(() => {
    if (isLoading && !loadingStartTimeRef.current) {
      loadingStartTimeRef.current = Date.now();
      setCanStopLoading(false);
      
      // Set minimum display time
      const timeout = setTimeout(() => {
        setCanStopLoading(true);
      }, MIN_LOADER_DISPLAY_TIME);
      
      return () => clearTimeout(timeout);
    } else if (!isLoading) {
      loadingStartTimeRef.current = null;
    }
  }, [isLoading]);

  // Handle route changes
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
    }
  }, [pathname, searchParams]);

  // Stop loading once all data is loaded AND minimum time has passed
  useEffect(() => {
    // Don't check data loading if auth is still loading
    if (authLoading) {
      return;
    }

    const isDataLoading = interviewsLoading || assigneesLoading || interviewersLoading;
    
    if (isLoading && !isDataLoading && canStopLoading) {
      // Small delay to ensure UI has rendered
      const timeout = setTimeout(() => {
        stopLoading();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, interviewsLoading, assigneesLoading, interviewersLoading, stopLoading, canStopLoading, authLoading]);

  return null;
}
