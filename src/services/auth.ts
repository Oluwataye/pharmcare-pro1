import { supabase } from '@/lib/supabase'

export const signIn = async (email: string, password: string) => {
  console.log('Attempting to sign in with:', email)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    
    console.log('Sign in successful:', data)
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Get session error:', error)
    throw error
  }
  return session?.user
}

export const getCurrentUserProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Get profile error:', error)
      throw error
    }
    
    console.log('User profile retrieved:', data)
    return data
  } catch (error) {
    console.error('Get profile error:', error)
    throw error
  }
}