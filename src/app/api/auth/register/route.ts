import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const { email, password, fullName } = await request.json();

        // Validate input
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: 'Email, password, and full name are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Create the user using admin client (bypasses RLS)
        const adminSupabase = createAdminClient();

        // Create auth user
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for now
        });

        if (authError) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // Create user profile using admin client (bypasses RLS)
        const { error: profileError } = await adminSupabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                full_name: fullName,
                is_onboarded: false,
                currency: 'MXN',
                language: 'es',
                timezone: 'America/Mexico_City',
                notifications_enabled: true,
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Clean up the auth user if profile creation failed
            await adminSupabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: 'Failed to create user profile' },
                { status: 500 }
            );
        }

        // Create notification preferences for the new user
        const { error: notifPrefError } = await adminSupabase
            .from('notification_preferences')
            .insert({
                user_id: authData.user.id,
                email_address: email,
                push_enabled: true,
                email_enabled: true,
                whatsapp_enabled: false,
                default_reminder_days: 3,
                quiet_hours_start: '22:00:00',
                quiet_hours_end: '08:00:00',
                timezone: 'America/Mexico_City',
            });

        if (notifPrefError) {
            console.error('Notification preferences creation error:', notifPrefError);
            // Don't fail registration, just log the error
        }

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}