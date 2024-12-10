'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLocale } from '@/contexts/LocaleContext'

gsap.registerPlugin(ScrollTrigger)

const Navbar = () => {
  const { currentLocale, changeLocale, t } = useLocale()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

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

  if (!mounted) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold metal-text">
          Royal Team
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8">
          {menuItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`text-white hover:text-gray-300 transition-colors ${
                  pathname === item.href ? 'font-bold' : ''
                }`}
              >
                {t(`navigation.${item.key}`)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Select value={currentLocale} onValueChange={changeLocale}>
            <SelectTrigger className="w-[100px]">
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

        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/95 backdrop-blur-md">
            <div className="flex flex-col h-full">
              <SheetHeader>
                <Link href="/" className="text-2xl font-bold metal-text">
                  Royal Team
                </Link>
              </SheetHeader>
            
              {/* Mobile Navigation Links */}
              <nav className="flex-1 mt-8">
                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className={`block text-lg text-white hover:text-gray-300 transition-colors ${
                          pathname === item.href ? 'font-bold' : ''
                        }`}
                      >
                        {t(`navigation.${item.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Actions ve Footer */}
              <div className="mt-auto">
                {/* Mobile Actions */}
                <div className="space-y-4 mb-4">
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

                {/* Footer */}
                <div className="pt-4 text-sm text-center text-gray-400 border-t border-gray-800">
                  {t('auth.poweredBy')}{' '}
                  <span className="gradient-text animate-gradient">
                    {t('common.company')}
                  </span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

export default Navbar

