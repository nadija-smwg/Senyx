'use client';
import { useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex justify-center mb-7 group cursor-default">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Senyx Icon" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-300" />
          <div className="flex flex-col justify-center mt-1">
            <img src="/name-transparent.png" alt="SENYX" className="h-6 object-contain object-left" />
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 text-center" style={{ color: '#1A6DB6' }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-7">
        <h1 className="text-xl font-bold font-heading text-gray-900">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-100">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Email</label>
          <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-[#1A6DB6] hover:text-[#155a96]">Forgot password?</Link>
          </div>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full h-9 mt-1" disabled={isLoading}>
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        No account?{' '}
        <Link href="/register" className="font-semibold text-[#1A6DB6] hover:text-[#155a96]">Sign up</Link>
      </p>
    </div>
  );
}
