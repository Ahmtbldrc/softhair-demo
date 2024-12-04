'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Navbar = () => {
  const [language, setLanguage] = useState('de')
  const pathname = usePathname()

  useEffect(() => {
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
  }, [])

  const menuItems = [
    { name: 'Startseite', href: '/' },
    { name: 'Galerie', href: '/gallery' },
    { name: 'Team', href: '/team' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold metal-text">
          Royal Team
        </Link>
        <ul className="hidden md:flex space-x-8">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`text-white hover:text-gray-300 transition-colors ${
                  pathname === item.href ? 'font-bold' : ''
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Sprache" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="#termin">Termin buchen</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

