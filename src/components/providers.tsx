"use client";

import { ReactNode } from 'react';
import { InterviewProvider } from '@/contexts/interviews.context';
import { InterviewerProvider } from '@/contexts/interviewers.context';
import { ClientProvider } from '@/contexts/clients.context';
import { ResponseProvider } from '@/contexts/responses.context';
import { AssigneesProvider } from '@/contexts/users.context';
import { ToastProvider } from '@/components/ui/toast';

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ToastProvider>
      <InterviewProvider>
        <InterviewerProvider>
          <ClientProvider>
            <ResponseProvider>
              <AssigneesProvider>
                {children}
              </AssigneesProvider>
            </ResponseProvider>
          </ClientProvider>
        </InterviewerProvider>
      </InterviewProvider>
    </ToastProvider>
  );
};

export default Providers;
