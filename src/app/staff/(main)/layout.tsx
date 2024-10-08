import StaffLayout from "@/components/StaffLayout";

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StaffLayout>
    {children}
    </StaffLayout>;
}