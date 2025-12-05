'use client';

import { useLoading } from '@/contexts/loading.context';
import { Button } from '@/components/ui/button';

export function TestLoaderButton() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  const handleTest = () => {
    console.log('Starting loader...');
    startLoading();
    
    setTimeout(() => {
      console.log('Stopping loader...');
      stopLoading();
    }, 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <Button onClick={handleTest} variant="outline">
        Test Loader (isLoading: {isLoading ? 'true' : 'false'})
      </Button>
    </div>
  );
}


