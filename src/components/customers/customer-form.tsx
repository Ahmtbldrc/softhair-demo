"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/lib/database.types";
import { DialogFooter } from "@/components/ui/dialog";

// Define the customer type based on the database schema
type Customer = Database["public"]["Tables"]["customers"]["Row"] & {
  gender: "male" | "female";
};

// Define the form schema for customer creation/editing
const formSchema = z.object({
  name: z.string().min(1, "İsim alanı zorunludur"),
  surname: z.string().min(1, "Soyisim alanı zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz").optional().or(z.literal("")),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz").optional().or(z.literal("")),
  gender: z.enum(["male", "female"] as const),
});

export type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (values: CustomerFormValues) => void;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerForm({ initialData, onSubmit, isLoading, isOpen, onClose }: CustomerFormProps) {
  const { t } = useLocale();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      surname: initialData?.surname || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      gender: initialData?.gender || "male",
    },
  });

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customers.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("customers.name")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customers.surname")}</FormLabel>
              <FormControl>
                <Input placeholder={t("customers.surname")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customers.email")}</FormLabel>
              <FormControl>
                <Input placeholder={t("customers.email")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customers.phone")}</FormLabel>
              <FormControl>
                <Input placeholder={t("customers.phone")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customers.gender")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("customers.gender")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">{t("customers.male")}</SelectItem>
                  <SelectItem value="female">{t("customers.female")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("customers.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.loading") : t("customers.save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
} 