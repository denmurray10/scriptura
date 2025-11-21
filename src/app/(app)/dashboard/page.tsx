
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import BookLoader from "@/components/BookLoader";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    // isMobile is initially undefined while the check runs on the client.
    if (isMobile === undefined) {
      return; // Wait until the check is complete.
    }

    if (isMobile) {
      router.replace('/dashboard-mobile');
    } else {
      router.replace('/dashboard-v2');
    }
  }, [isMobile, router]);

  // Display a loader while the redirect is happening.
  return <BookLoader />;
}
