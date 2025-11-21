
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (activeTab === "signin") {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ variant: "success", title: "Success!", description: "Signed in successfully." });
      } else {
        await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        toast({
          variant: "success",
          title: "Account Created!",
          description: "You can now sign in.",
        });
      }
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description:
          error.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : error.code === "auth/email-already-in-use"
            ? "This email is already in use."
            : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm
                  form={form}
                  onSubmit={onSubmit}
                  isLoading={isLoading}
                  buttonText="Sign In"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  It's quick and easy to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm
                  form={form}
                  onSubmit={onSubmit}
                  isLoading={isLoading}
                  buttonText="Sign Up"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline hover:text-primary">
                Back to Homepage
            </Link>
        </p>
      </div>
    </div>
  );
}

function AuthForm({ form, onSubmit, isLoading, buttonText }: { form: any; onSubmit: any; isLoading: boolean; buttonText: string; }) {
  return (
    <div className="space-y-4">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {buttonText}
                </Button>
            </form>
        </Form>
    </div>
  );
}
