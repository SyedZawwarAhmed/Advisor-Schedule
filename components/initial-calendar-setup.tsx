'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function InitialCalendarSetup() {
  const { data: session } = useSession();

  useEffect(() => {
    const connectCalendar = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/auth/connect-calendar', {
            method: 'POST',
          });
          
          if (!response.ok) {
            console.error('Failed to connect calendar:', await response.text());
          }
        } catch (error) {
          console.error('Error connecting calendar:', error);
        }
      }
    };

    connectCalendar();
  }, [session]);

  return null;
} 