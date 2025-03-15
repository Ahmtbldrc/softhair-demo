import AdminLayout from "@/components/AdminLayout";
import { Toaster } from "@/components/ui/toaster";


export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>
    {children}
    <Toaster />
    </AdminLayout>;
}