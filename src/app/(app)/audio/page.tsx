
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { Mic, ArrowLeft } from "lucide-react";
import { AnimateInView } from "@/components/AnimateInView";
import { Button } from "@/components/ui/button";

export default function AudioComingSoonPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
            <AnimateInView>
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <Mic className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CardTitle className="text-2xl">Audio Books Coming Soon!</CardTitle>
                        <CardDescription className="max-w-xs mx-auto">
                            Get ready to experience your stories like never before. Fully narrated, interactive audio adventures are on the way.
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
