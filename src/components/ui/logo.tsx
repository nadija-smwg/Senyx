import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
}

export function Logo({ className, showIcon = true, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)} {...props}>
      {showIcon && (
        <div className="relative w-11 h-11 shrink-0 flex items-center justify-center -ml-1">
          <Image src="/logo-icon-transparent.png" alt="Senyx Logo" width={57} height={57} className="w-[130%] h-[130%] max-w-none object-contain drop-shadow-md" priority />
        </div>
      )}
      <div className="font-heading font-bold text-2xl tracking-tighter flex items-center">
        <span className="bg-gradient-to-t from-[var(--color-brand-red-dark)] to-[var(--color-brand-red-light)] bg-clip-text text-transparent">S</span>
        <span className="bg-gradient-to-t from-[var(--color-brand-orange-dark)] to-[var(--color-brand-orange-light)] bg-clip-text text-transparent">E</span>
        <span className="bg-gradient-to-r from-[var(--color-brand-orange)] to-[var(--color-brand-purple-light)] bg-clip-text text-transparent">N</span>
        <span className="bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-blue)] bg-clip-text text-transparent">Y</span>
        <span className="bg-gradient-to-t from-[var(--color-brand-blue)] to-[var(--color-brand-blue-light)] bg-clip-text text-transparent">X</span>
      </div>
    </div>
  );
}
