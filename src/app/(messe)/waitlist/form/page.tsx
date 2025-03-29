"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { toast } from "sonner";
import { z } from "zod";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const waitlistSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  saloonName: z.string().min(1, "Salon Name ist erforderlich"),
  staffCount: z.string().min(1, "Anzahl der Mitarbeiter ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().min(1, "Telefonnummer ist erforderlich"),
  salonSoftware: z.string().min(1, "Salon Software ist erforderlich"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

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
  const supabase = createClientComponentClient<Database>();
  const [isPhoneInputReady, setIsPhoneInputReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WaitlistFormData, string>>>({});
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: "",
    saloonName: "",
    staffCount: "",
    email: "",
    phone: "",
    salonSoftware: ""
  });

  useEffect(() => {
    setIsPhoneInputReady(true);
  }, []);

  const validateForm = () => {
    try {
      waitlistSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof WaitlistFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof WaitlistFormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('waitlists')
        .insert({
          name: formData.name,
          saloonName: formData.saloonName,
          staffCount: formData.staffCount ? parseInt(formData.staffCount) : null,
          email: formData.email,
          phone: formData.phone,
          salonSoftware: formData.salonSoftware,
          createdAt: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Ihre Nachricht wurde erfolgreich gesendet!");
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };
  
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
        <Card className="w-[400px] bg-white/5 border-white/20 card-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              <h2 className={`text-2xl font-bold text-white text-center ${inter.className}`}>
                Ich möchte mich auf die Warteliste setzen 😊
              </h2>
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ihr Name"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saloonName" className="text-white">Salon Name</Label>
                  <Input
                    id="saloonName"
                    value={formData.saloonName}
                    onChange={(e) => setFormData({...formData, saloonName: e.target.value})}
                    placeholder="Name Ihres Salons"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${errors.saloonName ? 'border-red-500' : ''}`}
                  />
                  {errors.saloonName && <p className="text-red-500 text-sm">{errors.saloonName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffCount" className="text-white">Anzahl der Mitarbeiter</Label>
                  <Input
                    id="staffCount"
                    type="number"
                    min="1"
                    value={formData.staffCount}
                    onChange={(e) => setFormData({...formData, staffCount: e.target.value})}
                    placeholder="Anzahl der Mitarbeiter"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${errors.staffCount ? 'border-red-500' : ''}`}
                  />
                  {errors.staffCount && <p className="text-red-500 text-sm">{errors.staffCount}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Ihre E-Mail"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Telefon</Label>
                  {isPhoneInputReady ? (
                    <div className={errors.phone ? 'border border-red-500 rounded-md' : ''}>
                      <PhoneInput
                        country={'de'}
                        value={formData.phone}
                        onChange={(phone) => setFormData({...formData, phone: phone})}
                        inputClass="!w-full !h-10 !text-base !border-white/20 !bg-white/10 !text-white placeholder:!text-white/50"
                        containerClass="!w-full"
                        buttonClass="!h-10 !border-white/20 !bg-white/10"
                        dropdownClass="!bg-black !text-white !border-white/20"
                        searchClass="!bg-black !text-white !border-white/20"
                        enableSearch={true}
                        inputProps={{
                          id: 'phone',
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '40px',
                          fontSize: '16px',
                          borderRadius: '6px',
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                        buttonStyle={{
                          borderRadius: '6px 0 0 6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 bg-background rounded-md animate-pulse" />
                  )}
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salonSoftware" className="text-white">Salon Software</Label>
                  <Input
                    id="salonSoftware"
                    value={formData.salonSoftware}
                    onChange={(e) => setFormData({...formData, salonSoftware: e.target.value})}
                    placeholder="Welche Software nutzen Sie?"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${errors.salonSoftware ? 'border-red-500' : ''}`}
                  />
                  {errors.salonSoftware && <p className="text-red-500 text-sm">{errors.salonSoftware}</p>}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button 
              className="w-full h-12 bg-black text-white border-2 border-black hover:bg-black/90 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 font-bold tracking-wide rounded-xl"
              variant="outline"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Wird gesendet..." : "Nachricht senden"}
            </Button>
            <Button 
              className="w-full h-12 bg-black text-white border-2 border-black hover:bg-black/90 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 font-bold tracking-wide rounded-xl"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Zurück
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer className="bg-transparent border-white/10" />
    </main>
  );
} 