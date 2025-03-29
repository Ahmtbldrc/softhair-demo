"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";

const backgroundStyle = `
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
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

  .card-shadow {
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.3),
                0 0 100px rgba(30, 64, 175, 0.2),
                0 0 150px rgba(30, 64, 175, 0.1);
  }
`

export default function FormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Burada form verilerini işleyebilir veya bir API'ye gönderebilirsiniz
      console.log("Form data:", formData);
      
      // Başarılı gönderim sonrası ana sayfaya yönlendir
      router.push("/waitlist/kadir");
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <main 
      className="fixed inset-0 w-full h-full"
      style={{
        background: "radial-gradient(circle at center, #1E40AF, #000000)",
      }}
    >
      <style jsx global>
        {backgroundStyle}
      </style>
      <div className="bg-pattern"></div>
      <div className="content">
        <div className="w-[400px] space-y-6">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-gray-200 to-gray-600">
            Auf die Warteliste für die Produkteinführung setzen
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-white">Nachricht</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/20 text-white min-h-[100px]"
              />
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit"
                className="w-full h-12 bg-black text-white border-2 border-black hover:bg-black/90 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 font-bold tracking-wide rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Wird gesendet..." : "Senden"}
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className="text-white hover:text-white/80"
                onClick={() => router.push("/waitlist/kadir")}
              >
                Zurück
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 