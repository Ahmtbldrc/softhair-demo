"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CircleUser, Menu, Search, Moon, Sun, Scissors, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logout } from "@/lib/auth"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Roles } from "@/lib/types"

const NavLink = React.memo(({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
  const pathname = usePathname()
  const isActive = pathname === href

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
  )
})
NavLink.displayName = "NavLink"

const NavLinks = React.memo(({ onClick }: { onClick?: () => void }) => (
  <>
    <NavLink href="/staff" onClick={onClick}>Dashboard</NavLink>
    <NavLink href="/staff/reservation" onClick={onClick}>Reservation</NavLink>
    <NavLink href="/staff/my-account" onClick={onClick}>My Account</NavLink>
  </>
))
NavLinks.displayName = "NavLinks"

const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-semibold text-primary">Loading...</p>
    </div>
  </div>
)

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [user, setUser] = useState<User | null>()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userRole = session?.user?.user_metadata.role;

      if (userRole === Roles.ADMIN) {
        window.location.href = "/admin";
      } else if (userRole !== Roles.STAFF) {
        window.location.href = "/not-found";
      } else {
        setUser(session?.user as User)
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/staff"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
            aria-label="SoftHair staff Home"
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
                href="/staff"
                className="flex items-center gap-2 text-lg font-semibold"
                aria-label="SoftHair staff Home"
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
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8 md:w-[200px] lg:w-[300px]"
                aria-label="Search"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hidden md:inline-flex">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full" aria-label="User menu">
                <CircleUser className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.user_metadata?.fullName as string}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme("light")}>Light Theme</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark Theme</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System Theme</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem> 
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex min-h-screen w-full flex-col bg-background">
        {children}
      </main>
    </div>
  )
}