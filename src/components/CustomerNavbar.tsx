'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
          {t('common.softhair')}
        </Link>
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
        <div className="flex items-center space-x-4">
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
            <Link href="#termin">
              {t('common.bookAppointment')}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

