
"use client";

import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, Download, PlusCircle, User, Library } from "lucide-react";
import Logo from "./Logo";
import { useStory } from "@/contexts/StoryContext";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", requiresActiveStory: false },
  { href: "/create", icon: PlusCircle, label: "Create", requiresActiveStory: false },
  { href: "/story", icon: BookOpen, label: "Story", requiresActiveStory: true },
  { href: "/characters", icon: Users, label: "Characters", requiresActiveStory: true },
  { href: "/library", icon: Library, label: "Library", requiresActiveStory: false },
  { href: "/profile", icon: User, label: "Profile", requiresActiveStory: false },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { exportStory, activeStory } = useStory();
  const isStoryActive = !!activeStory;

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex h-14 items-center justify-between p-3">
          <Logo />
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isDisabled = item.requiresActiveStory && !isStoryActive;
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            if(item.href === '/dashboard' && (pathname === '/dashboard-v2' || pathname === '/dashboard')) {
                // Special case to make dashboard active for both versions
            }

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild tooltip={item.label} isActive={pathname.startsWith(item.href)} disabled={isDisabled}>
                  <Link href={isDisabled ? "#" : item.href} aria-disabled={isDisabled} tabIndex={isDisabled ? -1 : undefined}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t">
         <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={exportStory}
                disabled={!isStoryActive}
                tooltip="Export Story"
              >
                <Download />
                <span>Export Story</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
