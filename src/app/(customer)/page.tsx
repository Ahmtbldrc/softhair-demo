'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Scissors, Palette, Brush, Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

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
  const carouselRef = useRef(null)
  const aboutRef = useRef(null)
  const priceRef = useRef(null)
  const contactRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [prices, setPrices] = useState<ServiceDetails[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const images = [
    '/image/slide/slide-1.jpg',
    '/image/slide/slide-2.jpg',
    '/image/slide/slide-3.jpg',
    '/image/slide/slide-4.jpg',
    '/image/slide/slide-5.jpg',
  ]
  const [isHovered, setIsHovered] = useState(false)
  const [direction, setDirection] = useState(0)

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

      // About section animasyonları
      const aboutTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 70%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      });

      aboutTimeline
        .fromTo('.about-section-title',
          {
            opacity: 0,
            y: 100,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "back.out(1.7)",
          }
        )
        .fromTo('.about-section-title .blur-xl',
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 1,
          },
          "-=0.5"
        )
        .fromTo('.about-section-divider',
          {
            scaleX: 0,
            opacity: 0,
          },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.8"
        )
        .fromTo('.about-section-subtitle',
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5"
        )
        // About content animasyonları
        .fromTo('.about-content',
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
          "-=0.3"
        )
        // Vurgulu kelimeler için animasyon
        .fromTo('.gradient-text',
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
            stagger: 0.1,
            ease: "power2.out"
          },
          "-=0.5"
        );

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
      );

      // Price section animasyonları
      const priceTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: priceRef.current,
          start: "top 70%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      });

      priceTimeline
        .fromTo('.price-section-title',
          {
            opacity: 0,
            y: 100,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "back.out(1.7)",
          }
        )
        .fromTo('.price-section-title .blur-xl',
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 1,
          },
          "-=0.5"
        )
        .fromTo('.price-section-divider',
          {
            scaleX: 0,
            opacity: 0,
          },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.8"
        )
        .fromTo('.price-section-subtitle',
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5"
        )
        // Fiyat kartları için yeni animasyon
        .fromTo('.price-item',
          {
            opacity: 0,
            y: 100,
            scale: 0.9,
            rotationX: -15,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1,
            stagger: {
              each: 0.2,
              from: "start",
              ease: "power3.out"
            },
            ease: "back.out(1.7)",
          },
          "-=0.2"
        )
        // Fiyat ve başlık elementleri için animasyon
        .fromTo(['.price-value', '.price-title'],
          {
            opacity: 0,
            y: 20,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: {
              each: 0.1,
              from: "start"
            },
            ease: "power2.out",
          },
          "-=0.4"
        );

      // Contact animasyonları
      const contactTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 70%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      });

      contactTimeline
        .fromTo('.contact-section-title',
          {
            opacity: 0,
            y: 100,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "back.out(1.7)",
          }
        )
        .fromTo('.contact-section-title .blur-xl',
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 1,
          },
          "-=0.5"
        )
        .fromTo('.contact-section-divider',
          {
            scaleX: 0,
            opacity: 0,
          },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.8"
        )
        .fromTo('.contact-section-subtitle',
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .fromTo('.contact-info',
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
          },
          "-=0.3"
        )
        .fromTo('.contact-map',
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
          },
          "-=0.8"
        );
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
      zIndex: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      zIndex: 2,
      transition: {
        duration: 0.7,
        ease: [0.32, 0.72, 0, 1],
        opacity: { duration: 0.3 },
        rotateY: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
      zIndex: 0
    }),
  }

  const nextImage = () => {
    setDirection(1)
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setDirection(-1)
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const getAdjacentImages = () => {
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length
    const nextIndex = (currentImageIndex + 1) % images.length
    return {
      prev: images[prevIndex],
      current: images[currentImageIndex],
      next: images[nextIndex]
    }
  }

  // Otomatik geçiş için useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(timer);
  }, [currentImageIndex]);

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-black text-white">
      <section ref={heroRef} className="min-h-screen relative flex items-center pt-8 mb-32">
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

      <section ref={aboutRef} className="min-h-screen flex flex-col items-center justify-center px-4 py-4 mb-16">
        <div className="container mx-auto">
          <div className="relative mb-20">
            <h2 className="text-6xl sm:text-7xl font-bold text-center about-section-title">
              <span className="inline-block relative">
                {/* Arka plan gölgesi */}
                <span className="absolute -inset-2 blur-xl bg-gradient-to-r from-zinc-500/20 via-zinc-300/20 to-zinc-500/20 rounded-lg"></span>
                
                {/* Ana başlık */}
                <span className="relative">
                  <span className="relative inline-block metal-text">
                    {/* Üst katman - parlak efekt */}
                    <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent bg-clip-text">
                      {t('about.title')}
                    </span>
                    
                    {/* Ana metin */}
                    <span className="relative bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.15)]">
                      {t('about.title')}
                    </span>
                  </span>
                </span>
              </span>
            </h2>
            
            {/* Ayraç çizgisi */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-32 h-0.5 about-section-divider">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"></div>
            </div>
            
            {/* Alt başlık */}
            <p className="text-zinc-400 text-center mt-8 text-lg tracking-wide font-light about-section-subtitle">
              {t('about.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-16">
            <div className="w-full lg:w-1/2 h-[400px] sm:h-[500px] lg:h-[800px] relative about-model pt-8 lg:pt-16">
              <Canvas 
                camera={{ position: [0, 0, 12], fov: 40 }}
                style={{ marginTop: '1rem' }}
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

            <div className="about-text w-full lg:w-1/2 pt-8 lg:pt-32">
              <div className="about-content text-xl sm:text-2xl lg:text-4xl max-w-2xl leading-relaxed">
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

      {/* Carousel section */}
      <section 
        ref={carouselRef} 
        className="min-h-[70vh] flex items-center justify-center mb-48 overflow-hidden px-4 sm:px-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full max-w-7xl mx-auto">
          <div className="relative w-full flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button 
              onClick={previousImage}
              className="absolute left-2 sm:left-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Image Container */}
            <div className="relative flex items-center justify-center gap-8 w-full perspective-[2000px]">
              {/* Previous Image - Hidden on mobile */}
              <motion.div 
                className="relative w-[320px] h-[180px] shrink-0 transition-all duration-700 hidden md:block"
                animate={{
                  scale: 0.85,
                  x: -40,
                  rotateY: 15,
                  opacity: 0.5,
                  filter: 'blur(2px)'
                }}
                whileHover={{
                  scale: 0.9,
                  opacity: 0.7,
                  filter: 'blur(1px)',
                  transition: { duration: 0.3 }
                }}
              >
                <Image
                  src={getAdjacentImages().prev}
                  alt="Previous image"
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg" />
              </motion.div>

              {/* Current Image Container */}
              <div className="relative w-full h-[200px] xs:h-[250px] sm:h-[300px] md:w-[640px] md:h-[360px]">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentImageIndex}
                    className="absolute inset-0 shrink-0 shadow-2xl"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                      transformOrigin: "center center"
                    }}
                  >
                    <Image
                      src={getAdjacentImages().current}
                      alt="Current image"
                      fill
                      className="object-cover rounded-lg"
                      priority
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div 
                      className="absolute inset-0 ring-1 ring-white/10 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next Image - Hidden on mobile */}
              <motion.div 
                className="relative w-[320px] h-[180px] shrink-0 transition-all duration-700 hidden md:block"
                animate={{
                  scale: 0.85,
                  x: 40,
                  rotateY: -15,
                  opacity: 0.5,
                  filter: 'blur(2px)'
                }}
                whileHover={{
                  scale: 0.9,
                  opacity: 0.7,
                  filter: 'blur(1px)',
                  transition: { duration: 0.3 }
                }}
              >
                <Image
                  src={getAdjacentImages().next}
                  alt="Next image"
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg" />
              </motion.div>
            </div>

            {/* Next Button */}
            <button 
              onClick={nextImage}
              className="absolute right-2 sm:right-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>
      </section>

      <section ref={priceRef} className="min-h-screen flex items-center justify-center px-4 py-16 mb-32">
        <div className="price-container w-full max-w-4xl">
          <div className="relative mb-20">
            <h2 className="text-6xl sm:text-7xl font-bold text-center price-section-title">
              <span className="inline-block relative">
                {/* Arka plan gölgesi */}
                <span className="absolute -inset-2 blur-xl bg-gradient-to-r from-zinc-500/20 via-zinc-300/20 to-zinc-500/20 rounded-lg"></span>
                
                {/* Ana başlık */}
                <span className="relative">
                  <span className="relative inline-block metal-text">
                    {/* Üst katman - parlak efekt */}
                    <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent bg-clip-text">
                      {t('prices.title')}
                    </span>
                    
                    {/* Ana metin */}
                    <span className="relative bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.15)]">
                      {t('prices.title')}
                    </span>
                  </span>
                </span>
              </span>
            </h2>
            
            {/* Ayraç çizgisi */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-32 h-0.5 price-section-divider">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"></div>
            </div>
            
            {/* Alt başlık */}
            <p className="text-zinc-400 text-center mt-8 text-lg tracking-wide font-light price-section-subtitle">
              {t('prices.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prices.map((price, index) => (
              <div 
                key={price.id} 
                className={`price-item group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-black p-0.5 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-zinc-700/10 ${
                  prices.length % 2 !== 0 && index === prices.length - 1 ? 'md:col-start-1 md:col-end-3 md:w-1/2 md:mx-auto' : ''
                }`}
              >
                <div className="relative flex flex-col h-full bg-black rounded-xl p-6 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent rounded-xl" />
                  <div className="relative flex justify-between items-start mb-4">
                    <h3 className="price-title text-xl font-semibold text-white/90 group-hover:text-white transition-colors">
                      {price.name}
                    </h3>
                    <span className="price-value text-2xl font-bold metal-text">
                      {price.price}€
                    </span>
                  </div>
                  <div className="relative mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-zinc-400">
                        {t('prices.duration')}: ~{price.duration || 30} min
                      </span>
                      {/* <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-zinc-800 transition-all duration-300 hover:scale-105"
                      >
                        {t('common.bookNow')}
                      </Button> */}
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
          <div className="relative mb-20">
            <h2 className="text-6xl sm:text-7xl font-bold text-center contact-section-title">
              <span className="inline-block relative">
                {/* Arka plan gölgesi */}
                <span className="absolute -inset-2 blur-xl bg-gradient-to-r from-zinc-500/20 via-zinc-300/20 to-zinc-500/20 rounded-lg"></span>
                
                {/* Ana başlık */}
                <span className="relative">
                  <span className="relative inline-block metal-text">
                    {/* Üst katman - parlak efekt */}
                    <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent bg-clip-text">
                      {t('contact.title')}
                    </span>
                    
                    {/* Ana metin */}
                    <span className="relative bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.15)]">
                      {t('contact.title')}
                    </span>
                  </span>
                </span>
              </span>
            </h2>
            
            {/* Ayraç çizgisi */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-32 h-0.5 contact-section-divider">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"></div>
            </div>
            
            {/* Alt başlık */}
            <p className="text-zinc-400 text-center mt-8 text-lg tracking-wide font-light contact-section-subtitle">
              {t('contact.subtitle')}
            </p>
          </div>

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
                      <p className="text-lg font-semibold metal-text">081 558 84 56</p>
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
                      <p className="text-lg font-semibold metal-text">info@royalcoiffeur.ch</p>
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
                      <p className="text-lg font-semibold metal-text">Bahnhofstrasse 21A, 9470 Buchs</p>
                    </div>
                  </div>
                </div>

                <div className="contact-detail mt-8">
                  <h3 className="text-xl font-semibold mb-4 metal-text">{t('contact.hours')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">Mo - Do</p>
                      <p className="font-medium text-sm">09:00 - 19:00</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">Freitag</p>
                      <p className="font-medium text-sm">09:00 - 20:00</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">Samstag</p>
                      <p className="font-medium text-sm">09:00 - 17:30</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/30">
                      <p className="text-sm text-zinc-400">So / Feiertage</p>
                      <p className="font-medium text-sm">Geschlossen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-map h-auto rounded-2xl overflow-hidden relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800">
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none"></div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.409722750949!2d13.394913776680424!3d52.52000687210677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851c655f20989%3A0x26bbfb4e84674c63!2sHauptstra%C3%9Fe%2C%20Berlin%2C%20Germany!5e0!3m2!1sen!2sus!4v1701745391689!5m2!1sen!2sus"
                className="w-full aspect-square lg:aspect-auto lg:h-full"
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

