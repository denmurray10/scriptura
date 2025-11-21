
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { Users, ArrowLeft } from "lucide-react";
import { AnimateInView } from "@/components/AnimateInView";
import { Button } from "@/components/ui/button";

export default function CoopComingSoonPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
            <AnimateInView>
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <Users className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CardTitle className="text-2xl">Co-op Adventures Coming Soon!</CardTitle>
                        <CardDescription className="max-w-xs mx-auto">
                            Get ready to team up with friends for a shared storytelling experience. This feature is currently in development.
                        </CardDescription>
                        <Button onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </AnimateInView>
        </div>
    );
}
