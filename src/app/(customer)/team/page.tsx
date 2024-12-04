'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Card, CardContent } from '@/components/ui/card'

gsap.registerPlugin(ScrollTrigger)

const teamMembers = [
  { name: 'Anna Schmidt', role: 'Stylistin', image: '/placeholder.svg?height=300&width=300' },
  { name: 'Max Müller', role: 'Colorist', image: '/placeholder.svg?height=300&width=300' },
  { name: 'Lisa Weber', role: 'Barbier', image: '/placeholder.svg?height=300&width=300' },
  { name: 'Tom Becker', role: 'Stylist', image: '/placeholder.svg?height=300&width=300' },
]

export default function Team() {
  const teamRef = useRef(null)
  const aboutRef = useRef(null)

  useEffect(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.team-card')
    cards.forEach((card, index) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        opacity: 0,
        y: 50,
        rotation: index % 2 === 0 ? -5 : 5,
      })
    })

    gsap.from(aboutRef.current, {
      scrollTrigger: {
        trigger: aboutRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
      opacity: 0,
      x: -100,
    })
  }, [])

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 metal-text">Unser Team</h1>
          <div className="mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Startseite
            </Link>{' '}
            &gt; Team
          </div>
          <div ref={teamRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="team-card neon-card overflow-hidden">
                <CardContent className="p-0">
                  <Image src={member.image} alt={member.name} width={300} height={300} className="w-full h-auto" />
                  <div className="p-4">
                    <h3 className="text-xl font-bold metal-text">{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section ref={aboutRef} className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-4 metal-text">Über unser Team</h2>
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

