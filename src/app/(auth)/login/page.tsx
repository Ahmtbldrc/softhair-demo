"use client"
import React, {useState} from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Roles } from '@/lib/types';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@softsidedigital.com`,
        password,
      });

      if (error){
        throw error;
      }

      const userRole = data.session?.user?.user_metadata.role;

      window.location.href = userRole == Roles.ADMIN ? '/admin' : '/staff';

    } catch {
      toast({
        title: 'Warning',
        description: "Username or password wrong"
      })
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-[390px] space-y-6">
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader>
                <h1 className="text-3xl font-bold">SoftHair Login</h1>
                <p className="text-muted-foreground">
                  Enter your email below to login to your account
                </p>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="email">Username</Label>
                      <Input
                        id="username"
                        type="username"
                        placeholder="Username"
                        required
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
      <div className="hidden flex-1 bg-muted lg:block">
        <Image
          src="/image/barber.png"
          alt="Image"
          width={1920}
          height={1080}
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
