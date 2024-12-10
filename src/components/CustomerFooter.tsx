'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Preload, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useLocale } from '@/contexts/LocaleContext'

// Model yolunu sabit bir değişken olarak tanımlayalım
const MODEL_PATH = '/models/scene.gltf'

function BarberChair() {
  const { scene } = useGLTF(MODEL_PATH)

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.material) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xF5F5F5,
            metalness: 0.3,
            roughness: 0.2,
            clearcoat: 0.4,
            clearcoatRoughness: 0.2,
          })
        }
      }
    })
  }, [scene])

  return <primitive object={scene} scale={0.7} />
}

// Model'i önceden yükle
useGLTF.preload(MODEL_PATH)

const Footer = () => {
  const { t } = useLocale();

  const menuItems = [
    { key: 'home', href: '/' },
    { key: 'gallery', href: '/gallery' },
    { key: 'team', href: '/team' },
  ]

  const socialLinks = [
    { 
      key: 'facebook', 
      href: 'https://facebook.com/royalteam',
      icon: Facebook,
      ariaLabel: 'footer.followFacebook'
    },
    { 
      key: 'instagram', 
      href: 'https://instagram.com/royalteam',
      icon: Instagram,
      ariaLabel: 'footer.followInstagram'
    },
    { 
      key: 'twitter', 
      href: 'https://twitter.com/royalteam',
      icon: Twitter,
      ariaLabel: 'footer.followTwitter'
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

  return (
    <footer className="bg-black text-white pt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Logo ve Sosyal Medya */}
          <div className="flex flex-col space-y-4 items-center md:items-start">
            <Link href="/" className="text-3xl font-bold metal-text">
              {t('common.brand')}
            </Link>
            <p className="text-gray-400 text-center md:text-left">
              {t('footer.slogan')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ key, href, icon: Icon, ariaLabel }) => (
                <a 
                  key={key}
                  href={href}
                  className="hover:text-gray-300 transition-colors" 
                  aria-label={t(ariaLabel)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Linkler */}
          <div className="flex flex-col space-y-4 items-center md:items-start">
            <h3 className="text-xl font-semibold">{t('footer.links')}</h3>
            <ul className="space-y-3 text-center md:text-left">
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
          <div className="flex flex-col space-y-4 items-center col-span-1 md:col-span-2">
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
          <div className="flex items-center justify-center h-[200px] relative mt-8 md:mt-0">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 45 }}
              className="w-[250px] h-full"
              dpr={[1, 2]}
            >
              <ambientLight intensity={0.8} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              <spotLight
                position={[5, 5, 5]}
                angle={0.3}
                penumbra={1}
                intensity={1}
                castShadow
              />
              <Environment preset="studio" />
              <BarberChair />
              <OrbitControls 
                enableZoom={false}
                autoRotate
                autoRotateSpeed={5}
              />
              <Preload all />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Copyright bölümü */}
      <div className="border-t border-gray-800 mt-8">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
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

