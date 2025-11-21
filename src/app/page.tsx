
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BookLoader from "@/components/BookLoader";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard-mobile');
  }, [router]);

  return <BookLoader />;
}
