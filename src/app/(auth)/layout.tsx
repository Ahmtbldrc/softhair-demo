import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from "@/contexts/LocaleContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      {children}
      <Toaster />
    </LocaleProvider>
  );
}
