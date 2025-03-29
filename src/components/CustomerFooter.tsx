'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Phone, Mail, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useLocale } from '@/contexts/LocaleContext'

// 3D modeli dinamik olarak import et
const ThreeJSScene = dynamic(() => import('@/components/ThreeJSScene'), {
  ssr: false,
  loading: () => <div className="h-[200px] md:h-[250px]" />
})

const Footer = () => {
  const { t } = useLocale()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const menuItems = [
    { key: 'home', href: '/' },
    { key: 'gallery', href: '/gallery' },
    { key: 'team', href: '/team' },
  ]

  const socialLinks = [
    { 
      key: 'instagram', 
      href: 'https://www.instagram.com/stylinglounge61?igsh=MXB2amVheXJvaWJmMg%3D%3D&utm_source=qr',
      icon: Instagram,
      ariaLabel: 'footer.followInstagram'
    }
  ]

  const contactInfo = [
    {
      icon: Phone,
      value: 'footer.phone'
    },
    {
      icon: Mail,
      value: 'footer.email'
    },
    {
      icon: MapPin,
      value: 'footer.addressOneLine',
      desktopValue: ['footer.street', 'footer.city', 'footer.country']
    }
  ]

  if (!mounted) {
    return null
  }

  return (
    <footer className="bg-black text-white mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo ve Sosyal Medya */}
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" className="w-32 h-16">
              <Image
                src="/image/Logo-2007.png"
                alt="Styling Lounge 61 Logo"
                width={200}
                height={100}
                className="object-contain"
              />
            </Link>
            <p className="text-gray-400 text-center">{t('footer.slogan')}</p>
            <div className="flex space-x-4">
              {socialLinks.map(({ key, href, icon: Icon, ariaLabel }) => (
                <Link
                  key={key}
                  href={href}
                  className="hover:text-gray-300 transition-colors" 
                  aria-label={t(ariaLabel)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Linkler */}
          <div className="flex flex-col space-y-4 items-center">
            <h3 className="text-xl font-semibold">{t('footer.links')}</h3>
            <ul className="space-y-3 text-center">
              {menuItems.map((item) => (
                <li key={item.key} className="relative group">
                  <Link 
                    href={item.href} 
                    className="text-gray-400 hover:text-white transition-colors relative after:content-['↗'] after:ml-2 after:opacity-0 after:absolute after:top-0 after:right-[-20px] group-hover:after:opacity-100 after:transition-opacity"
                  >
                    <span>{t(`navigation.${item.key}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim Bilgileri */}
          <div className="flex flex-col space-y-4 items-center">
            <h3 className="text-xl font-semibold">{t('footer.contact')}</h3>
            <ul className="space-y-3 w-full max-w-sm">
              {contactInfo.map(({ icon: Icon, value, desktopValue }, index) => (
                <li key={index}>
                  <div className="flex items-start justify-center space-x-2 text-gray-400">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-1" />
                    {desktopValue ? (
                      <span className="text-center">
                        <span className="md:hidden">{t(value)}</span>
                        <span className="hidden md:inline">
                          {desktopValue.map((key, i) => (
                            <span key={key}>
                              {t(key)}
                              {i < desktopValue.length - 1 && <br />}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : (
                      <span>{t(value)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 3D Model */}
          <div className="flex items-center justify-center relative mt-8 md:mt-0">
            {mounted && <ThreeJSScene />}
          </div>
        </div>
      </div>

      {/* Copyright bölümü */}
      <div className="border-t border-gray-800 mt-8">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="text-center text-sm text-gray-400">
            <span>© {new Date().getFullYear()} {t('common.brand')} | {t('auth.poweredBy')}{' '}</span>
            <Link
              href="https://softsidedigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="dark:bg-gradient-to-r dark:from-gray-400 dark:via-white dark:to-gray-400 bg-gradient-to-r from-black via-gray-200 to-black animate-gradient bg-[length:200%_100%] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              {t('common.company')}
            </Link>          
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

