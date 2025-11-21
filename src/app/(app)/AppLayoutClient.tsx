
"use client";

import MobileBottomNav from "@/components/MobileBottomNav";
import { StoryProvider } from "@/contexts/StoryContext";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages where the mobile nav should be completely hidden (full-screen experiences)
  const noNavPaths = [
    '/story',
    '/story-narrator',
    '/story-audio',
    '/story-co-op',
    '/admin/persuasion-test',
    '/admin/lockpicking-test',
    '/admin/riddle-test',
    '/admin/liars-dice-test',
    '/admin/npc-interaction-test',
    '/book',
  ];
  
  const specialPaddingPaths = ['/dashboard-mobile', '/library'];

  const isNavHidden = noNavPaths.some(path => pathname.startsWith(path));

  // Determine if the page should have standard padding.
  const isPaddedPage = !isNavHidden && !specialPaddingPaths.includes(pathname);
  
  return (
    <StoryProvider>
      <div
        className={cn(
          "min-h-screen bg-background",
          // Apply standard padding on most pages
          isPaddedPage && "p-4 md:p-8",
          // Apply specific horizontal padding for the mobile dashboard and library
          specialPaddingPaths.includes(pathname) && "px-[10px]",
          // Add bottom padding on all pages where the nav is visible to prevent overlap
          !isNavHidden && "pb-24"
        )}
      >
        {children}
      </div>
      {/* The MobileBottomNav component now decides its own visibility based on isNavHidden */}
      <MobileBottomNav isHidden={isNavHidden} />
    </StoryProvider>
  );
}
