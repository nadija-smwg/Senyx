'use client';
import { useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Logo } from '../../../components/ui/logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-white/20 shadow-xl border shadow-slate-200/50 dark:shadow-none">
      <CardHeader className="space-y-1 text-center flex flex-col items-center">
        <Logo className="justify-center mb-4 scale-110" />
        <CardTitle className="text-2xl font-heading font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription>
          Enter your email below to log into your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-destructive font-medium">{error}</div>}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
