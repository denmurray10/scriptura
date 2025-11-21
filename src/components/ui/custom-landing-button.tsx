import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';

interface CustomLandingButtonProps {
  href: string;
  children: React.ReactNode;
}

const CustomLandingButton = ({ href, children }: CustomLandingButtonProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-between whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "h-14 text-lg rounded-[5px]",
        "px-6"
      )}
    >
      {children}
    </Link>
  );
};

export default CustomLandingButton;
