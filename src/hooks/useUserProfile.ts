import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Hook to fetch user profile including currency preference
 * Returns the user profile data and loading state
 */
export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>('MXN');
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const getProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (mounted) {
          if (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
            setCurrency('MXN'); // Default fallback
          } else {
            setProfile(data);
            setCurrency(data?.currency || 'MXN');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useUserProfile:', error);
        if (mounted) {
          setProfile(null);
          setCurrency('MXN'); // Default fallback
          setLoading(false);
        }
      }
    };

    getProfile();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, [userId, supabase]);

  return { profile, currency, loading };
}
