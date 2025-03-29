'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menu } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLocale } from '@/contexts/LocaleContext'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'

const Navbar = () => {
  const { currentLocale, changeLocale, t } = useLocale()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setMounted(true)
    
    // GSAP'i yalnızca client tarafında yükle
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger)
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      gsap.fromTo('nav', 
        {
          top: 0,
          borderRadius: 0,
          width: '100%',
          left: 0,
          padding: '0',
          border: '0px solid rgba(255, 255, 255, 0)',
        },
        {
          scrollTrigger: {
            start: 'top+=80 top',
            end: 'top+=81 top',
            scrub: 0,
            toggleActions: "play none none reverse",
          },
          top: '1rem',
          borderRadius: '2rem',
          width: '70%',
          left: '15%',
          padding: '0 1rem',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }
      )
    })

    return () => ctx.revert()
  }, [mounted])

  const menuItems = [
    { key: 'home', href: '/' },
    { key: 'gallery', href: '/gallery' },
    { key: 'team', href: '/team' },
  ]

  // Server-side rendering sırasında minimal içerik göster
  if (!isClient) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Image
            src="/image/Logo-2007.png"
            alt="Royal Team Logo"
            width={150}
            height={50}
            className="object-contain"
            priority
          />
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <Image
            src="/image/Logo-2007.png"
            alt="Royal Team Logo"
            width={120}
            height={50}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-white hover:text-gray-300 transition-colors ${
                pathname === item.href ? 'font-bold' : ''
              }`}
            >
              {t(`navigation.${item.key}`)}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Select value={currentLocale} onValueChange={changeLocale}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('common.language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/newReservation">
              {t('common.bookAppointment')}
            </Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-black/95 backdrop-blur-md border-gray-800">
            <div className="px-2 py-1.5">
              <Link href="/">
                <Image
                  src="/image/Logo-2007.png"
                  alt="Royal Team Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                  priority
                />
              </Link>
            </div>
            <div className="h-px bg-gray-800 my-2" />
            {menuItems.map((item) => (
              <DropdownMenuItem key={item.key} asChild>
                <Link
                  href={item.href}
                  className={`text-white hover:text-gray-300 transition-colors ${
                    pathname === item.href ? 'font-bold' : ''
                  }`}
                >
                  {t(`navigation.${item.key}`)}
                </Link>
              </DropdownMenuItem>
            ))}
            <div className="h-px bg-gray-800 my-2" />
            <div className="px-2 py-1.5 space-y-2">
              <Select value={currentLocale} onValueChange={changeLocale}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.language')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild className="w-full">
                <Link href="/newReservation">
                  {t('common.bookAppointment')}
                </Link>
              </Button>
            </div>
            <div className="h-px bg-gray-800 my-2" />
            <div className="px-2 py-1.5 text-sm text-center text-gray-400">
              {t('auth.poweredBy')}{' '}
              <span className="gradient-text animate-gradient">
                {t('common.company')}
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

export default Navbar

