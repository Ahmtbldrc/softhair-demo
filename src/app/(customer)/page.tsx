'use client'

import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import * as THREE from 'three'

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
  const { scene } = useGLTF('/models/scene.gltf')

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xE8E8E8,    // Daha açık gümüş rengi
          metalness: 0.8,      // Biraz daha az metalik
          roughness: 0.2,      // Biraz daha parlak
          envMapIntensity: 1.5 // Yansıma yoğunluğu
        })
      }
    })
  }, [scene])

  return <primitive object={scene} />
}

useGLTF.preload('/models/scene.gltf')

export default function Home() {
  const heroRef = useRef(null)
  const servicesRef = useRef(null)
  const aboutRef = useRef(null)
  const priceRef = useRef(null)
  const contactRef = useRef(null)

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    heroTl.to('.hero-content', { opacity: 0, y: -50 })

    const serviceCards = gsap.utils.toArray<HTMLElement>('.service-card')
    serviceCards.forEach((card, index) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: servicesRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: true,
        },
        opacity: 0,
        x: index % 2 === 0 ? -100 : 100,
        rotation: index % 2 === 0 ? -10 : 10,
      })
    })

    gsap.from('.about-text', {
      scrollTrigger: {
        trigger: aboutRef.current,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
      opacity: 0,
      x: '100%',
    })

    gsap.from('.price-item', {
      scrollTrigger: {
        trigger: priceRef.current,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
      opacity: 0,
      y: 50,
      stagger: 0.1,
    })

    gsap.from('.contact-info', {
      scrollTrigger: {
        trigger: contactRef.current,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
      opacity: 0,
      x: -100,
    })

    gsap.from('.contact-map', {
      scrollTrigger: {
        trigger: contactRef.current,
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      },
      opacity: 0,
      x: 100,
    })
  }, [])

  return (
    <div className="bg-black text-white">
      <section ref={heroRef} className="h-screen flex items-center justify-between px-4">
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
          <Canvas>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <OrbitControls enableZoom={false} autoRotate />
            <BarberChair />
          </Canvas>
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

      <section ref={aboutRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="about-text text-center">
          <h2 className="text-4xl font-bold mb-8 metal-text">Über uns</h2>
          <p className="text-xl max-w-3xl mx-auto">
            Royal Team ist Ihr <span className="metal-text">vertrauenswürdiger Partner</span> für perfektes Styling.
            Mit <span className="metal-text">jahrelanger Erfahrung</span> und <span className="metal-text">Leidenschaft</span> für unser Handwerk
            sorgen wir dafür, dass Sie sich <span className="metal-text">wohl und selbstbewusst</span> fühlen.
            Unser Ziel ist es, Ihre <span className="metal-text">natürliche Schönheit</span> zu betonen und Ihnen ein
            <span className="metal-text">strahlendes Lächeln</span> ins Gesicht zu zaubern.
          </p>
        </div>
      </section>

      <section ref={priceRef} className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="bg-gray-900 p-8 rounded-lg neon-card">
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
            <h2 className="text-4xl font-bold mb-8 metal-text">Kontakt</h2>
            <p>
              <strong className="metal-text">Telefon:</strong> +49 123 456789
            </p>
            <p>
              <strong className="metal-text">E-Mail:</strong> info@royalteam.de
            </p>
            <p>
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

