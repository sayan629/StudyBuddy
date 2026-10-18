import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  imageClassName?: string;
  animate?: boolean;
}

const sizeConfig = {
  xs: {
    container: 'h-7 w-7 rounded-lg',
    px: 28,
    text: 'text-lg',
    gap: 'gap-2',
  },
  sm: {
    container: 'h-8 w-8 rounded-xl',
    px: 32,
    text: 'text-xl',
    gap: 'gap-2.5',
  },
  md: {
    container: 'h-10 w-10 rounded-xl',
    px: 40,
    text: 'text-2xl',
    gap: 'gap-3',
  },
  lg: {
    container: 'h-12 w-12 rounded-2xl',
    px: 48,
    text: 'text-3xl',
    gap: 'gap-3.5',
  },
  xl: {
    container: 'h-16 w-16 rounded-2xl',
    px: 64,
    text: 'text-4xl',
    gap: 'gap-4',
  },
};

export function BrandLogo({
  size = 'md',
  showText = true,
  className,
  imageClassName,
  animate = true,
}: BrandLogoProps) {
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={cn('inline-flex items-center', config.gap, className)}>
      <div
        className={cn(
          'relative overflow-hidden bg-white shadow-md ring-1 ring-violet-500/20 dark:ring-white/10 shrink-0 p-0.5',
          config.container,
          animate && 'animate-float-1 transition-transform duration-300 hover:scale-105'
        )}
      >
        <Image
          src="/logo.png"
          alt="StudyBuddy Logo"
          width={config.px}
          height={config.px}
          className={cn('w-full h-full object-contain', imageClassName)}
          priority
        />
      </div>

      {showText && (
        <span
          className={cn(
            'font-heading font-extrabold tracking-tight text-gradient-rainbow select-none',
            config.text
          )}
        >
          StudyBuddy
        </span>
      )}
    </div>
  );
}

