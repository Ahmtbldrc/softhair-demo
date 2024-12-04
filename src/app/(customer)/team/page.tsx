'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'

gsap.registerPlugin(ScrollTrigger)

const teamMembers = [
  { name: 'Anna Schmidt', role: 'Stylistin', image: '/image/barber.png' },
  { name: 'Max Müller', role: 'Colorist', image: '/placeholder.svg?height=300&width=300' },
  { name: 'Lisa Weber', role: 'Barbier', image: '/placeholder.svg?height=300&width=300' },
  { name: 'Tom Becker', role: 'Stylist', image: '/placeholder.svg?height=300&width=300' },
]

export default function Team() {
  const teamRef = useRef(null)
  const aboutRef = useRef(null)
  const teamTextRef = useRef(null)

  useEffect(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.team-card')
    
    gsap.set(cards, {
      opacity: 0,
      y: 50,
      rotation: 0
    })

    cards.forEach((card, index) => {
      gsap.fromTo(card, 
        {
          opacity: 0,
          y: 50,
          rotation: index % 2 === 0 ? -5 : 5,
        },
        {
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=100",
            end: "top center",
            toggleActions: "play none none reverse",
            once: false,
          },
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: index * 0.1,
        }
      )
    })

    // About section için animasyon
    gsap.fromTo(aboutRef.current,
      {
        opacity: 0,
        x: -100,
      },
      {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top bottom-=100",
          end: "top center",
          toggleActions: "play none none reverse",
          once: false,
        },
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out"
      }
    )

    const initiallyVisibleCards = cards.filter((card) => {
      const rect = card.getBoundingClientRect()
      return rect.top < window.innerHeight
    })

    if (initiallyVisibleCards.length > 0) {
      gsap.to(initiallyVisibleCards, {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1
      })
    }

    gsap.fromTo(teamTextRef.current,
      {
        position: 'absolute',
        opacity: 0,
        scale: 1.2,
        top: '-50%',
        left: '50%',
        xPercent: -50,
        yPercent: 0,
        rotation: -20,
        zIndex: 50,
      },
      {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 0.5,
          toggleActions: "play none none reverse",
        },
        position: 'absolute',
        opacity: 1,
        scale: 1,
        top: '10px',
        left: '95%',
        xPercent: -100,
        yPercent: 0,
        rotation: 6,
        ease: "power1.inOut",
      }
    )
  }, [])

  return (
    <div className="bg-black text-white">
      <section className="min-h-screen flex items-start pt-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 metal-text">Unser Team</h1>
          <div className="mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Startseite
            </Link>{' '}
            &gt; Team
          </div>
          <div ref={teamRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-24">
            {teamMembers.map((member, index) => (
              <Card key={index} className="team-card neon-card overflow-hidden relative group">
                <CardContent className="p-0 relative aspect-square">
                  <Image 
                    src={member.image} 
                    alt={member.name} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold metal-text drop-shadow-sm">{member.name}</h3>
                      <p className="text-gray-100 text-md font-medium drop-shadow-sm mt-1">{member.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section ref={aboutRef} className="min-h-screen flex items-center px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="relative mb-8">
                <h2 className="text-5xl font-bold metal-text">Über unser</h2>
                <div 
                  ref={teamTextRef}
                  className="absolute opacity-0 z-50"
                  style={{ width: 'auto', whiteSpace: 'nowrap' }}
                >
                  <span className="inline-block border border-white/40 rounded-lg px-3 py-1 text-lg metal-text">
                    Team
                  </span>
                </div>
              </div>
              <p className="text-lg">
                Unser <span className="metal-text">erfahrenes Team</span> von Stylisten und Coloristen ist darauf spezialisiert,
                Ihnen den <span className="metal-text">perfekten Look</span> zu verleihen. Mit jahrelanger Erfahrung und
                ständiger Weiterbildung sind wir immer auf dem neuesten Stand der <span className="metal-text">Frisurentrends</span>.
                Wir legen großen Wert auf <span className="metal-text">individuelle Beratung</span> und gehen auf Ihre persönlichen
                Wünsche ein, um sicherzustellen, dass Sie unser Salon mit einem <span className="metal-text">strahlenden Lächeln</span> verlassen.
              </p>
            </div>
            <div className="md:w-1/2">
              <Image src="/placeholder.svg?height=400&width=600" alt="Team" width={600} height={400} className="rounded-lg neon-card" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

