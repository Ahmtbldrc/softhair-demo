import AdminLayout from "@/components/AdminLayout";

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>
    {children}
    </AdminLayout>;
}