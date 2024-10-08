"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CircleUser, Menu, Search, Moon, Sun, Scissors } from "lucide-react"
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

const NavLink = React.memo(({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`text-muted-foreground font-semibold transition-colors hover:text-foreground dark:hover:text-white ${
        isActive ? "text-black dark:text-white  font-semibold" : ""
      }`}
    >
      {children}
    </Link>
  )
})
NavLink.displayName = "NavLink"

const NavLinks = React.memo(() => (
  <>
    <NavLink href="/staff">Dashboard</NavLink>
    <NavLink href="/staff/staff">Staff</NavLink>
    <NavLink href="/staff/services">Services</NavLink>
    <NavLink href="/staff/reservation">Reservation</NavLink>
  </>
))
NavLinks.displayName = "NavLinks"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()

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
        <Sheet>
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
              >
                <Scissors className="h-6 w-6" />
                SoftHair
              </Link>
              <NavLinks />
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
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                aria-label="Search"
              />
            </div>
          </form>
          <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
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