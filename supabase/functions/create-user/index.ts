import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation and sanitization utilities
const sanitizeString = (input: string | undefined, maxLength: number): string | undefined => {
  if (!input) return undefined
  return input
    .replace(/[<>\"'&]/g, '') // Remove XSS characters
    .trim()
    .substring(0, maxLength)
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

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

const validateUsername = (username: string | undefined): boolean => {
  if (!username) return true // Optional
  // Alphanumeric, underscore, dash only
  const usernameRegex = /^[a-zA-Z0-9_\-]+$/
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 50
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
      console.warn(`Unauthorized user creation attempt by user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Only SUPER_ADMIN can create users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check rate limit: 10 user creations per hour per admin
    const rateLimit = await checkRateLimit(supabaseAdmin, user.id, 'create_user', 10, 60)
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user creation by ${user.id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remainingAttempts: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    const { email, password, name, username, role } = await req.json()

    // Validate inputs
    if (!email || !validateEmail(email)) {
      throw new Error('Invalid email address')
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error || 'Invalid password')
    }

    if (!name || name.length < 2 || name.length > 200) {
      throw new Error('Name must be between 2 and 200 characters')
    }

    if (username && !validateUsername(username)) {
      throw new Error('Username must be 3-50 characters and contain only letters, numbers, underscores, and dashes')
    }

    const validRoles = ['SUPER_ADMIN', 'PHARMACIST', 'CASHIER']
    if (role && !validRoles.includes(role)) {
      throw new Error('Invalid role')
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 200)
    const sanitizedUsername = sanitizeString(username, 50)
    const sanitizedEmail = email.toLowerCase().trim()

    console.log(`Creating user: ${sanitizedEmail} with role ${role || 'CASHIER'}`)

    // Create user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: sanitizedName,
        username: sanitizedUsername,
        role: role || 'CASHIER'
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      
      // Sanitize error message
      if (createError.message.includes('already registered')) {
        throw new Error('A user with this email already exists')
      }
      throw new Error('Failed to create user')
    }

    // The trigger will create the profile and default role
    // But we need to update the role if it's not CASHIER
    if (role && role !== 'CASHIER') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', newUser.user.id)

      if (roleUpdateError) {
        console.error('Error updating role:', roleUpdateError)
      }
    }

    console.log(`User created successfully: ${newUser.user.id}`)

    return new Response(
      JSON.stringify({ 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          created_at: newUser.user.created_at
        },
        remainingAttempts: rateLimit.remaining
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating user'
    
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
