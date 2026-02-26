import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Use service role key to log rate limiting if needed, though unauthenticated might be tricky.
        // For rate_limits, we'll try with the service role key to ensure we can write to rate_limits
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

        console.log(`[login-with-turnstile] Request received: ${req.method} ${req.url}`);

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const { email, password, captchaToken } = body

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: 'Email and password are required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        if (!captchaToken) {
            return new Response(
                JSON.stringify({ error: 'Captcha token is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitIdentifier = `login_${email}_${clientIP}`;

        // Rate limit: 10 login attempts per 15 minutes per IP/email combo
        const rateLimit = await checkRateLimit(supabaseAdmin, rateLimitIdentifier, 'login', 10, 15)
        if (!rateLimit.allowed) {
            console.warn(`Rate limit exceeded for login attempt by ${email} from ${clientIP}`)
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded. Please try again later.',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            )
        }

        // Validate Turnstile Token
        const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY');
        if (!TURNSTILE_SECRET_KEY) {
            console.error('TURNSTILE_SECRET_KEY is not set in environment variables');
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const formData = new FormData();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', captchaToken);

        if (clientIP !== 'unknown') {
            formData.append('remoteip', clientIP);
        }

        console.log(`[login-with-turnstile] Verifying captcha for ${email}...`);
        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileResult = await turnstileResponse.json();

        if (!turnstileResult.success) {
            console.warn(`[login-with-turnstile] Captcha verification failed for ${email}:`, turnstileResult['error-codes']);
            return new Response(
                JSON.stringify({ error: 'Verification failed. Please try again.', details: turnstileResult['error-codes'] }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`[login-with-turnstile] Captcha verified for ${email}. Proceeding with authentication...`);

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error(`[login-with-turnstile] Supabase auth error for ${email}:`, authError.message);
            return new Response(
                JSON.stringify({ error: authError.message || 'Invalid login credentials' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        console.log(`[login-with-turnstile] Login successful for user: ${authData.user.id}`);

        return new Response(
            JSON.stringify({
                session: authData.session,
                user: authData.user
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Error in login-with-turnstile function:', error)
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during login'

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
