import { ReactNode } from "react";
import { Toaster } from "sonner";

interface MesseLayoutProps {
  children: ReactNode;
}

export default function MesseLayout({ children }: MesseLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
} 