'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { fetchClient } from '../../../lib/api-client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    setStatus('loading');
    try {
      await fetchClient('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || 'Failed to reset password');
    }
  };

  return (
    <Card className="rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-white/20 shadow-2xl border shadow-slate-200/50 dark:shadow-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-heading font-bold">Set New Password</CardTitle>
        <CardDescription>
          Please enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Your password has been successfully reset.</p>
            <Button className="w-full" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required 
              />
            </div>
            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
            <Button type="submit" className="w-full" disabled={status === 'loading'}>
              {status === 'loading' ? 'Saving...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
