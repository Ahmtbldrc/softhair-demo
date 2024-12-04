import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

const Footer = () => {
  const menuItems = [
    { name: 'Startseite', href: '/' },
    { name: 'Galerie', href: '/galerie' },
    { name: 'Team', href: '/team' },
  ]

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="text-2xl font-bold metal-text">
              Royal Team
            </Link>
            <p className="mt-2 text-sm">Ihr Friseur für den perfekten Look</p>
          </div>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="hover:text-gray-300 transition-colors">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-gray-300 transition-colors">
              <Facebook />
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              <Instagram />
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              <Twitter />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 py-4 text-center text-sm">
        <Link href="https://softsidedigital.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
          © {new Date().getFullYear()} Royal Team | Entwickelt von Softside Digital
        </Link>
      </div>
    </footer>
  )
}

export default Footer

