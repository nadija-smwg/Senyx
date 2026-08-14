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
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-transparent.png" alt="Loading..." className="w-10 h-10 object-contain animate-pulse" />
          <Spinner className="w-5 h-5 text-[#1A6DB6]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: '#F8F9FC' }}>
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
