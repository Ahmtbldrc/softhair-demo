'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import * as THREE from 'three'
import React from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import Link from 'next/link'
import { ServiceDetails } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Scissors, Palette, Brush, Sparkles, Heart } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

function BarberChair() {
  const { scene } = useGLTF('/models/barber-chair.glb')
  const meshRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5,
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.5
          })
        }
      }
    })
  }, [scene])

  useFrame((_state, delta: number) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= delta * 0.3
    }
  })

  return (
    <group ref={meshRef}>
      <primitive 
        object={scene} 
        scale={0.005}
        position={[0, -1, 0]} 
        rotation={[0, Math.PI, 0]} 
      />
    </group>
  )
}

useGLTF.preload('/models/barber-chair.glb')

export default function Home() {
  const { t } = useLocale()
  const heroRef = useRef(null)
  const servicesRef = useRef(null)
  const aboutRef = useRef(null)
  const priceRef = useRef(null)
  const contactRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [prices, setPrices] = useState<ServiceDetails[]>([])

  // Servisleri getir
  useEffect(() => {
    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', true)
        .eq('branchId', 1)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setPrices(data || []);
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const ctx = gsap.context(() => {
      // Service cards animasyonu
      const serviceCards = gsap.utils.toArray<HTMLElement>('.service-card')
      serviceCards.forEach((card, index) => {
        gsap.fromTo(card, 
          {
            opacity: 0,
            y: 150,
            rotation: index % 2 === 0 ? -10 : 10,
          },
          {
            opacity: 1,
            y: 0,
            rotation: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 60%",
              toggleActions: "play none none reverse"
            }
          }
        )
      })

      // About section animasyonu
      const aboutTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.about-text',
          start: "top center",
          end: "top 25%",
          toggleActions: "play none none reverse"
        }
      })

      // Başlık harfleri için animasyon
      gsap.utils.toArray<HTMLElement>('.about-title-char').forEach((char, index) => {
        aboutTimeline.fromTo(char,
          {
            opacity: 0,
            scale: 3,
            rotateY: -180,
            z: -500,
            filter: 'blur(20px)',
          },
          {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            z: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: "power4.out",
          },
          index * 0.15
        )
      })

      // Normal metin animasyonu
      aboutTimeline.fromTo('.about-content',
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out"
        },
        "-=0.5"
      )

      // Vurgulu kelimeler için animasyon
      gsap.utils.toArray<HTMLElement>('.gradient-text').forEach((text) => {
        aboutTimeline.fromTo(text,
          {
            opacity: 0,
            scale: 0.8,
            filter: 'blur(10px)'
          },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: "power2.out"
          },
          "-=0.6"
        )
      })

      // Price section animasyonu
      gsap.fromTo('.price-container',
        {
          opacity: 0,
          y: 300,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: priceRef.current,
            start: "top center",
            end: "top 25%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Price items için ayrı animasyon
      gsap.fromTo('.price-item',
        {
          opacity: 0,
          x: -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: priceRef.current,
            start: "top 45%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Contact animasyonları
      gsap.fromTo('.contact-info',
        {
          opacity: 0,
          x: -100,
          y: 50,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contactRef.current,
            start: "top center",
            end: "top 25%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Contact başlığı için ayrı animasyon
      gsap.fromTo('.contact-title',
        {
          opacity: 0,
          y: 50,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: contactRef.current,
            start: "top center",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Contact detayları için stagger animasyon
      gsap.fromTo('.contact-detail',
        {
          opacity: 0,
          x: -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contactRef.current,
            start: "top 45%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // Map için ayrı animasyon
      gsap.fromTo('.contact-map',
        {
          opacity: 0,
          x: 100,
          y: 50,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contactRef.current,
            start: "top center",
            end: "top 25%",
            toggleActions: "play none none reverse"
          }
        }
      )

      // About section için 3D model animasyonu
      gsap.fromTo('.about-model',
        {
          opacity: 0,
          x: -100,
          scale: 0.8,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: aboutRef.current,
            start: "top center",
            end: "top 25%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    return () => ctx.revert()
  }, [mounted])

  const services = [
    { icon: Scissors, key: 'haircut' },
    { icon: Palette, key: 'coloring' },
    { icon: Brush, key: 'styling' },
    { icon: Sparkles, key: 'treatments' },
    { icon: Heart, key: 'bridal' },
    { icon: Scissors, key: 'beard' }
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-black text-white">
      <section ref={heroRef} className="min-h-screen relative flex items-center pt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="hero-content w-full text-center lg:text-left mb-8 lg:mb-0">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 metal-text"
              >
                {t('hero.title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-2xl sm:text-3xl mb-10"
              >
                {t('hero.subtitle.part1')}
                <span className="dark:bg-gradient-to-r dark:from-gray-500 dark:via-white dark:to-gray-500 bg-gradient-to-r from-black via-gray-200 to-black animate-gradient bg-[length:200%_100%] bg-clip-text text-transparent">
                  {t('hero.subtitle.part2')}
                </span>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex justify-center lg:justify-start"
              >
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/newReservation">
                    {t('common.bookAppointment')}
                  </Link>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative w-full h-[500px] rounded-lg overflow-hidden"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-lg"
              >
                <source src="/image/video.mp4" type="video/mp4" />
              </video>
            </motion.div>
          </div>
        </div>
      </section>

      {/* <section ref={servicesRef} className="min-h-screen flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-screen-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="service-card neon-card p-6 bg-black">
                <div className="text-4xl mb-4">
                  {React.createElement(service.icon, { 
                    size: 40,
                    className: "mx-auto" 
                  })}
                </div>
                <h3 className="text-xl font-bold mb-2 metal-text">
                  {t(`services.${service.key}.title`)}
                </h3>
                <p>{t(`services.${service.key}.description`)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      <section ref={aboutRef} className="min-h-screen flex flex-col items-center justify-center px-4 py-4 mt-64">
        <div className="container mx-auto">
          <h2 className="about-title text-7xl sm:text-8xl lg:text-9xl font-bold mb-20 text-center text-transparent" 
              style={{ 
                WebkitTextStroke: '2px white',
                transform: 'preserve-3d'
              }}>
            {t('about.title').split('').map((char, index) => (
              <span 
                key={index} 
                className="about-title-char inline-block"
                style={{ 
                  display: 'inline-block',
                  transform: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              >
                {char}
              </span>
            ))}
          </h2>
          
          <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
            <div className="w-full lg:w-1/2 h-[500px] sm:h-[600px] lg:h-[800px] relative about-model pt-16">
              <Canvas 
                camera={{ position: [0, 0, 12], fov: 40 }}
                style={{ marginTop: '2rem' }}
              >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
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
                  enablePan={false}
                  enableRotate={true}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                />
              </Canvas>
            </div>

            <div className="about-text w-full lg:w-1/2 pt-32">
              <div className="about-content text-2xl sm:text-3xl lg:text-4xl max-w-2xl leading-relaxed mt-8">
                <span>{t('about.content.intro')}</span>{' '}
                <span className="gradient-text">{t('about.content.trustedPartner')}</span>{' '}
                <span>{t('about.content.for')}</span>{' '}
                <span className="gradient-text">{t('about.content.experience')}</span>{' '}
                <span>{t('about.content.and')}</span>{' '}
                <span className="gradient-text">{t('about.content.passion')}</span>{' '}
                <span>{t('about.content.commitment')}</span>{' '}
                <span className="gradient-text">{t('about.content.confident')}</span>{' '}
                <span>{t('about.content.feel')}</span>{' '}
                <span className="gradient-text">{t('about.content.naturalBeauty')}</span>{' '}
                <span>{t('about.content.enhance')}</span>{' '}
                <span className="gradient-text">{t('about.content.smile')}</span>{' '}
                <span>{t('about.content.create')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={priceRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="price-container w-full max-w-4xl">
          <h2 className="text-5xl font-bold mb-12 text-center metal-text">
            {t('prices.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prices.map((price, index) => (
              <div 
                key={price.id} 
                className={`price-item group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-black p-0.5 transition-all hover:scale-[1.01] ${
                  prices.length % 2 !== 0 && index === prices.length - 1 ? 'md:col-start-1 md:col-end-3 md:w-1/2 md:mx-auto' : ''
                }`}
              >
                <div className="relative flex flex-col h-full bg-black rounded-xl p-6 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent rounded-xl" />
                  <div className="relative flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white/90 group-hover:text-white transition-colors">
                      {price.name}
                    </h3>
                    <span className="text-2xl font-bold metal-text">
                      {price.price}€
                    </span>
                  </div>
                  <div className="relative mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-zinc-400">
                        {t('prices.duration')}: ~{price.duration || 30} min
                      </span>
                      <Button variant="ghost" size="sm" className="hover:bg-zinc-800">
                        {t('common.bookNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={contactRef} className="min-h-screen flex items-center justify-center px-4 py-16 overflow-x-hidden">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="contact-title text-5xl md:text-6xl font-bold text-center mb-16 metal-text">
            {t('contact.title')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="contact-info bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800">
              <div className="space-y-8">
                <div className="contact-detail group">
                  <div className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-zinc-800/50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">{t('contact.phone')}</p>
                      <p className="text-lg font-semibold metal-text">+49 123 456789</p>
                    </div>
                  </div>
                </div>

                <div className="contact-detail group">
                  <div className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-zinc-800/50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">{t('contact.email')}</p>
                      <p className="text-lg font-semibold metal-text">info@royalteam.de</p>
                    </div>
                  </div>
                </div>

                <div className="contact-detail group">
                  <div className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-zinc-800/50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">{t('contact.address')}</p>
                      <p className="text-lg font-semibold metal-text">Hauptstraße 123, 10115 Berlin</p>
                    </div>
                  </div>
                </div>

                <div className="contact-detail mt-8">
                  <h3 className="text-xl font-semibold mb-4 metal-text">{t('contact.hours')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">Mon - Fri</p>
                      <p className="font-medium">09:00 - 20:00</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">Sat - Sun</p>
                      <p className="font-medium">10:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-map w-full h-[500px] rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none"></div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.409722750949!2d13.394913776680424!3d52.52000687210677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851c655f20989%3A0x26bbfb4e84674c63!2sHauptstra%C3%9Fe%2C%20Berlin%2C%20Germany!5e0!3m2!1sen!2sus!4v1701745391689!5m2!1sen!2sus"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

