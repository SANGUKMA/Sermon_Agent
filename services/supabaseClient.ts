
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// --- User Profile Functions ---

export async function upsertUserProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        email,
        full_name: fullName || '',
        last_sign_in: Date.now(),
      },
      { onConflict: 'user_id' }
    );
  if (error) {
    console.error('Upsert user profile error:', error);
  }
}

export async function checkUserActive(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_active')
    .eq('user_id', userId)
    .single();

  if (error) {
    // 프로필이 아직 없으면 활성으로 간주
    if (error.code === 'PGRST116') return true;
    console.error('Check user active error:', error);
    return true;
  }
  return data?.is_active ?? true;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  last_sign_in: number | null;
}

export async function fetchAllUserProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch all user profiles error:', error);
    return [];
  }
  return data || [];
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('user_id', userId);

  if (error) {
    console.error('Toggle user active error:', error);
    return false;
  }
  return true;
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Delete user profile error:', error);
    return false;
  }
  return true;
}
