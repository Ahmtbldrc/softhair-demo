import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { BranchProvider } from "@/contexts/BranchContext";

export const metadata: Metadata = {
  title: "SoftHair",
  description: "softhair",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <BranchProvider>
              {children}
            </BranchProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
