'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Lock, RefreshCw, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setName(`${data.user.firstName} ${data.user.lastName}`.trim());
          setEmail(data.user.email);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.success('No changes to save');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Settings" description="Manage your personal account details and preferences." />
      
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">FULL NAME</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled // Name should also be disabled or require an API to update employee record
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2 relative">
                <Label htmlFor="email">EMAIL ADDRESS</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    disabled 
                    className="pr-10 bg-slate-50 text-slate-500 cursor-not-allowed" 
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password">NEW PASSWORD</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10 bg-[#EEF2F6] border-none focus-visible:ring-1 focus-visible:ring-slate-300"
                  />
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving || !password}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
