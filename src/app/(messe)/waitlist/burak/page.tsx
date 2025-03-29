"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Inter } from "next/font/google";
import { FaLinkedin, FaInstagram, FaGlobe } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const backgroundStyle = `
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .bg-pattern {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }

  .gradient-text {
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
  }

  .title-text {
    background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
  }

  .card-shadow {
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.3),
                0 0 100px rgba(30, 64, 175, 0.2),
                0 0 150px rgba(30, 64, 175, 0.1);
  }
`

const generateVCF = () => {
  const vcf = `BEGIN:VCARD
VERSION:3.0
N:Aydogdu;Burak;;;
FN:Burak Aydogdu
TEL;TYPE=CELL:+491746161163
EMAIL:burak@tellmin.de
URL:https://www.instagram.com/tellmin_/
URL:https://tellmin.eu
PHOTO;VALUE=URL:https://demo.softsidedigital.com/image/burak.jpg
END:VCARD`;

  const blob = new Blob([vcf], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'burak_aydogdu.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function BurakPage() {
  const router = useRouter();
  
  return (
    <main 
      className="fixed inset-0 w-full h-full flex flex-col"
      style={{
        background: "radial-gradient(circle at center, #1E40AF, #000000)",
      }}
    >
      <style jsx global>
        {backgroundStyle}
      </style>
      <div className="bg-pattern"></div>
      <div className="content flex-1">
        <Card className="w-[350px] bg-white/5 border-white/20 card-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-56 h-56 overflow-hidden border-2 border-white/20 rounded-xl">
                <Image
                  src="/image/burak.jpg"
                  alt="Profile"
                  fill
                  className="object-cover"
                />
                <a 
                  onClick={generateVCF}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors cursor-pointer"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-white" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </a>
              </div>
              <div className={`text-center space-y-2 ${inter.className}`}>
                <h2 className="text-3xl font-bold dark:bg-gradient-to-r dark:from-gray-400 dark:via-white dark:to-gray-400 bg-gradient-to-r from-black via-gray-200 to-black animate-gradient bg-[length:200%_100%] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                  Burak Aydogdu
                </h2>
                <div className="space-y-2 text-gray-400">
                  <a href="mailto:burak@tellmin.de" className="text-base hover:text-white transition-colors block">
                  burak@tellmin.de
                  </a>
                  <a href="tel:+491746161163" className="text-base hover:text-white transition-colors block">
                    +49 174 6161163
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button 
              className="w-full h-12 bg-black text-white border-2 border-black hover:bg-black/90 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5  font-bold tracking-wide rounded-xl"
              variant="outline"
              onClick={() => router.push("/waitlist/form")}
            >
              Lass uns treffen?
            </Button>
            <Button 
              className="w-full h-12 bg-black text-white border-2 border-black hover:bg-black/90 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 font-bold tracking-wide rounded-xl flex items-center justify-center"
              variant="outline"
              onClick={() => window.open('https://wa.me/16508700942', '_blank')}
            >
              Chatten Sie jetzt mit TellMin KI !
              <Image
                src="/image/tellmin-logo.png"
                alt="TellMin Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </Button>
            <div className="flex justify-center gap-6 mt-2">
              <a href="https://www.instagram.com/tellmin_/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram size={24} />
              </a>
              <a href="https://tellmin.eu" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaGlobe size={24} />
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Footer className="bg-transparent border-white/10" />
    </main>
  );
} 