"use client";

import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StaffType } from "@/lib/types";
import Member from "./member";
import Pagination from "./pagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<number>(0);
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const itemsPerPage = 5;

  const filteredStaff = staff.filter((member) => {
    switch (filter) {
      case 0:
        return true;
      case 1:
        return member.status === true;
      case 2:
        return member.status === false;
      default:
        return true;
    }
  });

  const handleDelete = async (id: number) => {
    await supabase.from("staff").delete().eq("id", id);
    setStaff(staff.filter((member) => member.id !== id));
  };

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    supabase
      .from("staff")
      .select("*, services:staff_services(service:service_id(id, name))")
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        } else {
          setStaff(data);
          setIsLoading(false);
        }
      });
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="container mx-auto p-4 space-y-8">
          <Tabs
            defaultValue="0"
            onValueChange={(value) => {
              setFilter(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="0">{t("admin-staff.all")}</TabsTrigger>
                <TabsTrigger value="1">{t("admin-staff.active")}</TabsTrigger>
                <TabsTrigger value="2">{t("admin-staff.passive")}</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Link href="/admin/staff/add">
                  <Button size="sm" className="h-8">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("admin-staff.addStaff")}
                  </Button>
                </Link>
              </div>
            </div>
            {["0", "1", "2"].map((value) => (
              <TabsContent key={value} value={value} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin-staff.staffList")}</CardTitle>
                    <CardDescription>
                      {t("admin-staff.manageStaffAndViewServices")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="hidden w-[100px] sm:table-cell">
                            <span className="sr-only">{t("admin-staff.image")}</span>
                          </TableHead>
                          <TableHead>{t("admin-staff.fullName")}</TableHead>
                          <TableHead>{t("admin-staff.status")}</TableHead>
                          <TableHead className="hidden md:table-cell">
                            {t("admin-staff.services")}
                          </TableHead>
                          <TableHead>{t("admin-staff.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading
                          ? [...Array(3)].map((_, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Skeleton className="w-16 h-16 rounded" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-16 h-4 rounded" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-[60px] h-6 rounded" />
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Skeleton className="w-20 h-[22px] rounded-md" />
                                    <Skeleton className="w-20 h-[22px] rounded-md" />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-[36px] h-[36px] rounded" />
                                </TableCell>
                              </TableRow>
                            ))
                          : paginatedStaff.map((member) => (
                              <Member
                                key={member.id}
                                member={member}
                                handleDelete={() => handleDelete(member.id)}
                              />
                            ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t("admin-staff.showing")}{" "}
                      <strong>
                        {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredStaff.length
                        )}
                      </strong>{" "}
                      {t("admin-staff.of")}{" "}
                      <strong>{filteredStaff.length}</strong> {t("admin-staff.staffMembers")}
                    </div>
                  </CardFooter>
                  <Pagination
                    filteredStaff={filteredStaff}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                  />
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
