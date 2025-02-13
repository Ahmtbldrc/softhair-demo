"use client";
import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Roles } from "@/lib/types";
import LocaleToggle from "@/components/LocalToggle";
import { useLocale } from "@/contexts/LocaleContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { t } = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@softsidedigital.com`,
        password,
      });

      if (error) {
        throw error;
      }

      const userRole = data.session?.user?.user_metadata.role;
      
      window.location.href = userRole == Roles.ADMIN ? "/admin" : "/staff/reservation";
      return;
    } catch {
      toast({
        title: "Warning",
        description: "Username or password wrong",
      });
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="absolute top-4 right-4 z-50">
        <LocaleToggle />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-[390px] space-y-6 rounded-md p-8">
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader>
                <h1 className="text-3xl font-bold">{t("auth.loginTitle")}</h1>
                <p className="text-muted-foreground">
                  {t("auth.loginDescription")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="email">{t("auth.username")}</Label>
                    <Input
                      id="username"
                      type="username"
                      placeholder={t("auth.username")}
                      required
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        required
                        className="pr-10"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled={isLoading} type="submit" className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.loading")}
                    </>
                  ) : (
                    t("auth.login")
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
          <div className="flex justify-end mt-2 text-sm">
            <span>{t("auth.poweredBy")}</span>
            <a
              href="https://softsidedigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 dark:bg-gradient-to-r dark:from-gray-500 dark:via-white dark:to-gray-500 bg-gradient-to-r from-black via-gray-300 to-black animate-gradient bg-[length:200%_100%] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Softside Digital
            </a>
          </div>
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
