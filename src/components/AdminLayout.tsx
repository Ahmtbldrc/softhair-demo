"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUser,
  Menu,
  Moon,
  Sun,
  Scissors,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { logout } from "@/lib/auth";
import { Roles } from "@/lib/types";
import LocaleToggle from "@/components/LocalToggle";
import { useLocale } from "@/contexts/LocaleContext";
import Footer from "@/components/Footer";

const NavLink = React.memo(
  ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`text-muted-foreground font-semibold transition-colors hover:text-foreground dark:hover:text-white ${
          isActive ? "text-black dark:text-white  font-semibold" : ""
        }`}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
);
NavLink.displayName = "NavLink";

const NavLinks = React.memo(({ onClick }: { onClick?: () => void }) => {
  const { t } = useLocale();

  return (
    <>
      <NavLink href="/admin" onClick={onClick}>
        {t("admin.dashboard")}
      </NavLink>
      <NavLink href="/admin/staff" onClick={onClick}>
        {t("admin.staff")}
      </NavLink>
      <NavLink href="/admin/services" onClick={onClick}>
        {t("admin.services")}
      </NavLink>
      <NavLink href="/admin/reservation" onClick={onClick}>
        {t("admin.reservations")}
      </NavLink>
    </>
  );
});
NavLinks.displayName = "NavLinks";

const Loading = () => {
  const { t } = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-semibold text-primary">
          {mounted ? t("common.loading") : "Loading..."}
        </p>
      </div>
    </div>
  );
};

const UserDropdownContent = ({ user }: { user: User | null | undefined }) => {
  const { t } = useLocale();
  const { setTheme } = useTheme();

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>
        {user?.user_metadata?.fullName as string}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setTheme("light")}>
        {t("theme.light")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>
        {t("theme.dark")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>
        {t("theme.system")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>{t("common.settings")}</DropdownMenuItem>
      <DropdownMenuItem>{t("common.support")}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => logout()}>
        {t("auth.logout")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

const ThemeDropdownContent = () => {
  const { t } = useLocale();
  const { setTheme } = useTheme();

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => setTheme("light")}>
        {t("theme.light")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>
        {t("theme.dark")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>
        {t("theme.system")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const role = session.user.user_metadata.role;

      if (role === Roles.STAFF) {
        window.location.href = "/staff";
      } else if (role !== Roles.ADMIN) {
        window.location.href = "/not-found";
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
            aria-label="SoftHair Admin Home"
          >
            <Scissors className="h-6 w-6" />
            <span className="sr-only">SoftHair</span>
          </Link>
          <NavLinks />
        </nav>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-lg font-semibold"
                aria-label="SoftHair Admin Home"
                onClick={closeMenu}
              >
                <Scissors className="h-6 w-6" />
                SoftHair
              </Link>
              <NavLinks onClick={closeMenu} />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <LocaleToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hidden md:inline-flex"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t("theme.toggle")}</span>
              </Button>
            </DropdownMenuTrigger>
            <ThemeDropdownContent />
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                aria-label="User menu"
              >
                <CircleUser className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <UserDropdownContent user={user} />
          </DropdownMenu>
        </div>
      </header>
      <main className="flex min-h-screen w-full flex-col bg-background">
        {children}
      </main>
      <Footer />
    </div>
  );
}
