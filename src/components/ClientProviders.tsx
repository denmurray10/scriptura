"use client";

import CustomCursor from "@/components/CustomCursor";
import { Toaster } from "@/components/ui/toaster";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            <CustomCursor />
            {children}
            <Toaster />
        </>
    )
}