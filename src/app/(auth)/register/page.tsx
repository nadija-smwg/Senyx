'use client';
import { useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Logo } from '../../../components/ui/logo';

export default function RegisterPage() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      await register({ firstName, lastName, email, password });
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      setStatus('idle');
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-white/20 shadow-xl border shadow-slate-200/50 dark:shadow-none">
      <CardHeader className="space-y-1 text-center flex flex-col items-center">
        <Logo className="justify-center mb-4 scale-110" />
        <CardTitle className="text-2xl font-heading font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to sign up
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Check your email for a link to verify your account. If it doesn't appear within a few minutes, check your spam folder.</p>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === 'loading'}>
              {status === 'loading' ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>
        )}
      </CardContent>
      {status !== 'success' && (
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Log in
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
