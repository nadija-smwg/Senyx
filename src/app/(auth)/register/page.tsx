'use client';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';

/**
 * /register — Closed registration page.
 * Public self-registration is disabled; accounts are
 * created by administrators only.
 */
export default function RegisterPage() {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-center space-y-6">
      {/* Logo */}
      <div className="flex justify-center mb-2 group cursor-default">
        <div className="flex items-center gap-3">
          <img
            src="/logo-transparent.png"
            alt="Senyx Icon"
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col justify-center mt-1">
            <img
              src="/name-transparent.png"
              alt="SENYX"
              className="h-6 object-contain object-left"
            />
            <div
              className="text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 text-center"
              style={{ color: '#1A6DB6' }}
            >
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-[#1A6DB6]" />
        </div>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold font-heading text-gray-900">
          Access by Invitation Only
        </h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
          Employee accounts in Senyx Command Center are created by your
          organisation's administrator. Please contact your admin to get access.
        </p>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <Button asChild className="w-full h-9">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
