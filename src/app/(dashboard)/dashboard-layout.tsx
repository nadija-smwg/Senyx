'use client';
import { useAuth } from '../../hooks/use-auth';
import { Sidebar } from '../../components/layout/sidebar';
import { Topbar } from '../../components/layout/topbar';
import { Spinner } from '../../components/ui/spinner';
import { useEffect } from 'react';
import Image from 'next/image';
import { CurrencyProvider } from '@/providers/currency-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logo-icon-transparent.png" alt="Loading..." width={64} height={64} className="object-contain animate-pulse" />
          <Spinner className="w-5 h-5 text-[#1A6DB6]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <CurrencyProvider>
      <div className="relative flex h-screen overflow-hidden font-sans text-gray-900">
        {/* Subtle animated background — sits behind all dashboard content.
            Uses pure CSS animations (GPU-friendly translate). Respects
            prefers-reduced-motion. Does not change any business logic. */}
        <div aria-hidden className="senyx-app-bg">
          <div className="senyx-bg-blob senyx-bg-blob--blue" />
          <div className="senyx-bg-blob senyx-bg-blob--purple" />
          <div className="senyx-bg-blob senyx-bg-blob--orange" />
          <div className="senyx-bg-blob senyx-bg-blob--red" />
          <div className="senyx-bg-blob senyx-bg-blob--cyan" />
        </div>
        {/* Foreground content layer — above the animated background */}
        <div className="relative z-10 flex h-full w-full min-w-0">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            {/* Content region: 1440px max-width, centered, consistent padding */}
            <main className="flex-1 overflow-auto">
              <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </CurrencyProvider>
  );
}
