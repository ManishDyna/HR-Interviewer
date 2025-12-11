'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';
import { useInterviews } from '@/contexts/interviews.context';
import { useAssignees } from '@/contexts/users.context';
import { useInterviewers } from '@/contexts/interviewers.context';
import { useAuth } from '@/contexts/auth.context';

const MIN_LOADER_DISPLAY_TIME = 500; // Minimum time to show loader (ms)
const RENDER_BUFFER_TIME = 800; // Extra time to ensure page is fully rendered (ms)

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
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log('🔄 Route changed from', prevPathRef.current, 'to', pathname);
      prevPathRef.current = pathname;
    }
  }, [pathname, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Stop loading once all data is loaded AND minimum time has passed
  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    // Don't check data loading if auth is still loading
    if (authLoading) {
      console.log('🔐 Auth still loading, keeping loader visible');
      return;
    }

    const isDataLoading = interviewsLoading || assigneesLoading || interviewersLoading;
    
    console.log('📊 Navigation Loader State:', {
      isLoading,
      isDataLoading,
      canStopLoading,
      interviewsLoading,
      assigneesLoading,
      interviewersLoading
    });
    
    if (isLoading && !isDataLoading && canStopLoading) {
      console.log('⏳ Data loaded, waiting for render to complete...');
      
      // Give more time for page to fully render and paint
      renderTimeoutRef.current = setTimeout(() => {
        // Use requestAnimationFrame to wait for next paint
        requestAnimationFrame(() => {
          console.log('🎨 Page rendered, stopping navigation loader');
          stopLoading(); // This will only stop if counter reaches 0
          renderTimeoutRef.current = null;
        });
      }, RENDER_BUFFER_TIME);
      
      return () => {
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
      };
    }
  }, [isLoading, interviewsLoading, assigneesLoading, interviewersLoading, stopLoading, canStopLoading, authLoading]);

  return null;
}
