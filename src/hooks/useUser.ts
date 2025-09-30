import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Shared user hook to prevent duplicate auth calls
 * Returns the current user and loading state
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (mounted) {
          if (error) {
            console.error('Error fetching user:', error);
            setUser(null);
          } else {
            setUser(user);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useUser:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getUser();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  return { user, loading, router, supabase };
}