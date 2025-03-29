import { ReactNode } from "react";

interface MesseLayoutProps {
  children: ReactNode;
}

export default function MesseLayout({ children }: MesseLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 