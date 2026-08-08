'use client';
import { useAuth } from '../../hooks/use-auth';
import { Sidebar } from '../../components/layout/sidebar';
import { Topbar } from '../../components/layout/topbar';
import { Spinner } from '../../components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CurrencyProvider } from '@/providers/currency-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;
  }

  if (!user) return null;

  return (
    <CurrencyProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
