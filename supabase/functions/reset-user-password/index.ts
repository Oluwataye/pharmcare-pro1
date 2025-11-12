import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Password validation
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password too long (max 128 characters)' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' }
  }
  return { valid: true }
}

// Rate limiting helper
const checkRateLimit = async (
  supabase: any,
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
  
  const { data: existing, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: maxAttempts }
  }
  
  if (!existing) {
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        action,
        attempts: 1,
        window_start: new Date().toISOString()
      })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  if (existing.attempts >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }
  
  await supabase
    .from('rate_limits')
    .update({ 
      attempts: existing.attempts + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id)
  
  return { allowed: true, remaining: maxAttempts - existing.attempts - 1 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user has permission
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user has SUPER_ADMIN role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'SUPER_ADMIN') {
      console.warn(`Unauthorized password reset attempt by user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Only SUPER_ADMIN can reset passwords' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { userId, newPassword } = await req.json()

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID')
    }

    // Check rate limit: 3 password resets per hour per admin
    const rateLimit = await checkRateLimit(supabaseAdmin, user.id, 'password_reset', 3, 60)
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for password reset by ${user.id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remainingAttempts: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error || 'Invalid password')
    }

    console.log(`Resetting password for user: ${userId}`)

    // Reset the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error resetting password:', updateError)
      throw new Error('Failed to reset password')
    }

    console.log(`Password reset successfully for user: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset successfully',
        remainingAttempts: rateLimit.remaining
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in reset-user-password function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while resetting password'
    
    // Sanitize error message to prevent information disclosure
    const safeErrorMessage = errorMessage.includes('database') || errorMessage.includes('query')
      ? 'A system error occurred. Please try again.'
      : errorMessage
    
    return new Response(
      JSON.stringify({ error: safeErrorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
