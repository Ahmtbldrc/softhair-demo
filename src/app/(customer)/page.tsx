'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import * as THREE from 'three'
import React from 'react'

gsap.registerPlugin(ScrollTrigger)

const services = [
  { icon: '✂️', title: 'Haarschnitt', description: 'Professionelle Haarschnitte für jeden Stil' },
  { icon: '🎨', title: 'Färben', description: 'Kreative Haarfärbetechniken' },
  { icon: '💇', title: 'Styling', description: 'Perfektes Styling für jeden Anlass' },
  { icon: '💆', title: 'Behandlungen', description: 'Pflegende Haarbehandlungen' },
  { icon: '👰', title: 'Brautfrisuren', description: 'Traumhafte Frisuren für Ihren großen Tag' },
]

const prices = [
  { service: 'Damenhaarschnitt', price: '45€' },
  { service: 'Herrenhaarschnitt', price: '35€' },
  { service: 'Färben', price: '60€' },
  { service: 'Strähnen', price: '80€' },
  { service: 'Hochsteckfrisur', price: '70€' },
]

function BarberChair() {
  const { scene } = useGLTF('/models/barber-chair.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xF5F5F5,
          metalness: 0.8,
          roughness: 0.2,
          envMapIntensity: 1.5
        })
      }
    })
  }, [scene])

  return <primitive object={scene} scale={0.003} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} />
}

useGLTF.preload('/models/barber-chair.glb')

export default function Home() {
  const heroRef = useRef(null)
  const servicesRef = useRef(null)
  const aboutRef = useRef(null)
  const priceRef = useRef(null)
  const contactRef = useRef(null)

  useEffect(() => {
    // Hero animasyonunu kaldırıyorum çünkü hero section zaten görünür olacak
    
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
        index * 0.15 // Her harf 0.15 saniye arayla gelecek
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
  }, [])

  return (
    <div className="bg-black text-white">
      <section ref={heroRef} className="h-screen relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full pt-16 sm:pt-20">
            <div className="hero-content w-1/2">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-6xl font-bold mb-4 metal-text"
              >
                Royal Team
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-2xl mb-8"
              >
                Ihr Stil, unsere Leidenschaft
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <Button size="lg">Termin buchen</Button>
              </motion.div>
            </div>
            <div className="w-1/2 h-full">
              <Canvas
                camera={{ position: [0, 2, 8], fov: 45 }}
                style={{ background: 'transparent' }}
              >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <OrbitControls 
                  enableZoom={false} 
                  autoRotate 
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                />
                <BarberChair />
              </Canvas>
            </div>
          </div>
        </div>
      </section>

      <section ref={servicesRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="service-card neon-card p-6 bg-gray-900">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold mb-2 metal-text">{service.title}</h3>
              <p>{service.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section ref={aboutRef} className="min-h-screen flex items-center justify-center px-4 py-4">
        <div className="about-text text-center" style={{ perspective: '1000px' }}>
          <h2 className="about-title text-7xl sm:text-8xl lg:text-9xl font-bold mb-10 text-transparent" 
              style={{ 
                WebkitTextStroke: '2px white',
                transform: 'preserve-3d'
              }}>
            {'Über uns'.split('').map((char, index) => (
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
          <p className="about-content text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Royal Team ist Ihr{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              vertrauenswürdiger Partner
            </span>{' '}
            für perfektes Styling. Mit{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              jahrelanger Erfahrung
            </span>{' '}
            und{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              Leidenschaft
            </span>{' '}
            für unser Handwerk sorgen wir dafür, dass Sie sich{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              wohl und selbstbewusst
            </span>{' '}
            fühlen. Unser Ziel ist es, Ihre{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              natürliche Schönheit
            </span>{' '}
            zu betonen und Ihnen ein{' '}
            <span className="gradient-text bg-gradient-to-r from-gray-400 via-white to-gray-400 text-transparent bg-clip-text font-semibold">
              strahlendes Lächeln
            </span>{' '}
            ins Gesicht zu zaubern.
          </p>
        </div>
      </section>

      <section ref={priceRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="price-container bg-gray-900 p-8 rounded-lg neon-card w-full max-w-2xl">
          <h2 className="text-4xl font-bold mb-8 text-center metal-text">Unsere Preise</h2>
          <ul className="space-y-4">
            {prices.map((item, index) => (
              <li key={index} className="price-item flex justify-between items-center border-b border-gray-700 pb-2">
                <span>{item.service}</span>
                <span className="font-bold metal-text">{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section ref={contactRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="contact-info space-y-4">
            <h2 className="contact-title text-4xl font-bold mb-8 metal-text">Kontakt</h2>
            <p className="contact-detail">
              <strong className="metal-text">Telefon:</strong> +49 123 456789
            </p>
            <p className="contact-detail">
              <strong className="metal-text">E-Mail:</strong> info@royalteam.de
            </p>
            <p className="contact-detail">
              <strong className="metal-text">Adresse:</strong> Hauptstraße 123, 10115 Berlin
            </p>
          </div>
          <div className="contact-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.409722750949!2d13.394913776680424!3d52.52000687210677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851c655f20989%3A0x26bbfb4e84674c63!2sHauptstra%C3%9Fe%2C%20Berlin%2C%20Germany!5e0!3m2!1sen!2sus!4v1701745391689!5m2!1sen!2sus"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}

