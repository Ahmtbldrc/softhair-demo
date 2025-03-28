import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/CustomerNavbar'
import Footer from '@/components/CustomerFooter'
import BackToTop from '@/components/BackToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Styling Lounge 61 - Ihr Friseur in München',
  description: 'Professionelle Haarpflege und Styling in München',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <BackToTop />
        <Footer />
      </body>
    </html>
  )
}

