import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";

export const signIn = async (email: string, password: string) => {
  console.log('Attempting to sign in with:', email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful:', data);
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error);
    throw error;
  }
  return session?.user;
};

export const getCurrentUserProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Get profile error:', error);
      throw error;
    }
    
    if (!data) {
      console.log('No profile found, creating one...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            role: 'CASHIER'
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }
    
    console.log('User profile retrieved:', data);
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};