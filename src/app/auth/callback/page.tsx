'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check for PKCE code
        const code = searchParams?.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // Check for Implicit Flow (Hash) - Fallback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          // Check for error in query params
          const error = searchParams?.get('error');
          const errorDescription = searchParams?.get('error_description');

          if (error) {
            setStatus('error');
            setMessage(errorDescription || 'Verification failed. Please try again.');
          } else {
            // Only show error if we haven't found a code or token
            if (!code && !accessToken) {
              setStatus('error');
              setMessage('Invalid verification link.');
            }
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    handleEmailVerification();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-green-700 dark:text-green-400 font-medium">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-red-700 dark:text-red-400 font-medium">
                {message}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
