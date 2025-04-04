# Müşteri Yönetimi Modülü

Bu modül, müşteri verilerinin yönetimi için gerekli bileşenleri içerir.

## Bileşenler

### CustomerForm

Müşteri oluşturma ve düzenleme için kullanılan form bileşeni.

```tsx
import { CustomerForm } from "@/components/customers";

// Kullanım örneği
<CustomerForm 
  initialData={customer} // Düzenleme için mevcut müşteri verisi
  onSubmit={handleSubmit} // Form gönderildiğinde çalışacak fonksiyon
  isLoading={isSubmitting} // Yükleme durumu
/>
```

### DeleteCustomerDialog

Müşteri silme işlemi için onay dialog bileşeni.

```tsx
import { DeleteCustomerDialog } from "@/components/customers";

// Kullanım örneği
<DeleteCustomerDialog
  customer={customerToDelete} // Silinecek müşteri
  isOpen={isDeleteDialogOpen} // Dialog açık/kapalı durumu
  onClose={() => setIsDeleteDialogOpen(false)} // Dialog kapatıldığında çalışacak fonksiyon
  onConfirm={handleDeleteConfirm} // Silme işlemi onaylandığında çalışacak fonksiyon
/>
```

## Veri Yapısı

Müşteri verisi aşağıdaki yapıya sahiptir:

```typescript
interface Customer {
  id: number;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  gender: string;
  createdAt: string | null;
  updatedAt: string | null;
}
```

## Kullanım Örneği

```tsx
import { useState } from "react";
import { CustomerForm, DeleteCustomerDialog } from "@/components/customers";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const supabase = createClientComponentClient<Database>();

  // Müşteri oluşturma/güncelleme işlemi
  const handleSubmit = async (values) => {
    // Form verilerini işle
  };

  // Müşteri silme işlemi
  const handleDelete = async (id) => {
    // Silme işlemini gerçekleştir
  };

  return (
    <div>
      {/* Müşteri listesi */}
      
      {/* Müşteri formu */}
      <CustomerForm 
        initialData={editingCustomer}
        onSubmit={handleSubmit}
      />
      
      {/* Silme onay dialogu */}
      <DeleteCustomerDialog
        customer={customerToDelete}
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            handleDelete(customerToDelete.id);
          }
        }}
      />
    </div>
  );
}
``` 