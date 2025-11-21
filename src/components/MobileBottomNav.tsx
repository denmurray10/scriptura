
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, User, Library, MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  isHidden: boolean;
}

export default function MobileBottomNav({ isHidden }: MobileBottomNavProps) {
  const pathname = usePathname();

  if (isHidden) {
    return null;
  }
  
  const createItem = { href: "/create", icon: Plus, label: "Create" };
  
  const finalNavItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/library", icon: Library, label: "Library" },
    { href: "/co-op", icon: Users, label: "Co-op"},
    { href: "#", icon: "placeholder", label: "Create" },
    { href: "/audio", icon: Mic, label: "Audio" },
    { href: "/speak", icon: MessageSquare, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] h-14 bg-background/80 backdrop-blur-lg border border-border rounded-full shadow-lg z-50 transition-transform duration-300"
    >
      <nav className="h-full">
        <ul className="flex justify-between items-center h-full px-2">
          {finalNavItems.map((item, index) => {
            const isDashboard = item.href === '/dashboard' && (pathname.startsWith('/dashboard'));
            const isLibrary = item.href === '/library' && pathname === '/library';
            const isCoop = item.href === '/co-op' && pathname === '/co-op';
            const isSpeak = item.href === '/speak' && pathname.startsWith('/speak');
            const isAudio = item.href === '/audio' && pathname === '/audio';
            const isActive = isDashboard || isLibrary || isCoop || isSpeak || isAudio || (item.href !== '/' && item.href !== '/dashboard' && item.href !== '/library' && item.href !== '/audio' && item.href !== '/co-op' && item.href !== '/speak' && pathname.startsWith(item.href));
            const isDisabled = false;

            if (item.icon === "placeholder") {
              return (
                <li key="create-fab">
                  <Link
                    href={createItem.href}
                    className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
                  >
                    <Plus className="h-7 w-7" strokeWidth={1.5} />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={isDisabled ? "#" : item.href}
                  className={cn(
                    "relative flex items-center justify-center p-2 rounded-md h-full transition-all duration-200 active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground",
                    isDisabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:text-primary"
                  )}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
