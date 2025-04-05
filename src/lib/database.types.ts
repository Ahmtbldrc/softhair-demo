export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          created_at: string
          id: number
          name: string | null
          status: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          status?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          createdAt: string | null
          email: string | null
          gender: string
          id: number
          name: string
          phone: string | null
          surname: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          email?: string | null
          gender: string
          id?: never
          name: string
          phone?: string | null
          surname: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string | null
          gender?: string
          id?: never
          name?: string
          phone?: string | null
          surname?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          branchId: number | null
          createdat: string | null
          customer: Json | null
          customerId: number | null
          end: string | null
          id: number
          serviceId: number
          staffId: number | null
          start: string | null
          status: boolean | null
        }
        Insert: {
          branchId?: number | null
          createdat?: string | null
          customer?: Json | null
          customerId?: number | null
          end?: string | null
          id?: number
          serviceId: number
          staffId?: number | null
          start?: string | null
          status?: boolean | null
        }
        Update: {
          branchId?: number | null
          createdat?: string | null
          customer?: Json | null
          customerId?: number | null
          end?: string | null
          id?: number
          serviceId?: number
          staffId?: number | null
          start?: string | null
          status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "reservations_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "service_appointment_statistics"
            referencedColumns: ["serviceId"]
          },
          {
            foreignKeyName: "reservations_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "staff_appointment_statistics"
            referencedColumns: ["staffId"]
          },
        ]
      }
      services: {
        Row: {
          branchId: number | null
          duration: number | null
          id: number
          name: string | null
          price: number | null
          status: boolean
          subServiceIds: number[] | null
        }
        Insert: {
          branchId?: number | null
          duration?: number | null
          id?: number
          name?: string | null
          price?: number | null
          status?: boolean
          subServiceIds?: number[] | null
        }
        Update: {
          branchId?: number | null
          duration?: number | null
          id?: number
          name?: string | null
          price?: number | null
          status?: boolean
          subServiceIds?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
        ]
      }
      staff: {
        Row: {
          branchId: number | null
          email: string | null
          firstName: string | null
          id: number
          image: string | null
          languages: Json | null
          lastName: string | null
          password: string | null
          status: boolean | null
          userId: string | null
          username: string | null
          weeklyHours: Json | null
        }
        Insert: {
          branchId?: number | null
          email?: string | null
          firstName?: string | null
          id?: number
          image?: string | null
          languages?: Json | null
          lastName?: string | null
          password?: string | null
          status?: boolean | null
          userId?: string | null
          username?: string | null
          weeklyHours?: Json | null
        }
        Update: {
          branchId?: number | null
          email?: string | null
          firstName?: string | null
          id?: number
          image?: string | null
          languages?: Json | null
          lastName?: string | null
          password?: string | null
          status?: boolean | null
          userId?: string | null
          username?: string | null
          weeklyHours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
        ]
      }
      staff_services: {
        Row: {
          id: number
          service_id: number | null
          staff_id: number | null
        }
        Insert: {
          id?: number
          service_id?: number | null
          staff_id?: number | null
        }
        Update: {
          id?: number
          service_id?: number | null
          staff_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_appointment_statistics"
            referencedColumns: ["serviceId"]
          },
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_appointment_statistics"
            referencedColumns: ["staffId"]
          },
        ]
      }
      waitlists: {
        Row: {
          createdAt: string
          email: string | null
          id: number
          name: string | null
          phone: string | null
          salonSoftware: string | null
          saloonName: string | null
          staffCount: number | null
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          salonSoftware?: string | null
          saloonName?: string | null
          staffCount?: number | null
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          salonSoftware?: string | null
          saloonName?: string | null
          staffCount?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_emails: {
        Row: {
          email: string | null
        }
        Relationships: []
      }
      daily_income_for_weeks_by_branch_view: {
        Row: {
          branchId: number | null
          day: string | null
          last_week: number | null
          this_week: number | null
        }
        Relationships: []
      }
      recent_sales_by_staff_view: {
        Row: {
          branchid: number | null
          id: number | null
          image: string | null
          initials: string | null
          name: string | null
          weeklyEarnings: number | null
        }
        Relationships: []
      }
      recent_transactions_view: {
        Row: {
          amount: number | null
          branchId: number | null
          customer: string | null
          date: string | null
          email: string | null
          service: string | null
          staff: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "reservations_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
        ]
      }
      reservation_count_view: {
        Row: {
          branchId: number | null
          dailyActiveCount: number | null
          dailyPassiveCount: number | null
          dailyTotalCount: number | null
          monthlyActiveCount: number | null
          monthlyPassiveCount: number | null
          monthlyTotalCount: number | null
          weeklyActiveCount: number | null
          weeklyPassiveCount: number | null
          weeklyTotalCount: number | null
        }
        Relationships: []
      }
      service_appointment_statistics: {
        Row: {
          branchId: number | null
          dailyAppointments: number | null
          monthlyAppointments: number | null
          serviceId: number | null
          serviceName: string | null
          weeklyAppointments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "services_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
        ]
      }
      staff_appointment_statistics: {
        Row: {
          branchId: number | null
          dailyAppointments: number | null
          fullName: string | null
          monthlyAppointments: number | null
          staffId: number | null
          weeklyAppointments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "daily_income_for_weeks_by_branch_view"
            referencedColumns: ["branchId"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "recent_sales_by_staff_view"
            referencedColumns: ["branchid"]
          },
          {
            foreignKeyName: "staff_branchId_fkey"
            columns: ["branchId"]
            isOneToOne: false
            referencedRelation: "reservation_count_view"
            referencedColumns: ["branchId"]
          },
        ]
      }
    }
    Functions: {
      calculate_daily_occupancy: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
          booked: number
        }[]
      }
      calculate_overall_occupancy: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_daily_income_for_weeks: {
        Args: Record<PropertyKey, never>
        Returns: {
          day: string
          thisweek: number
          lastweek: number
        }[]
      }
      get_daily_visitors: {
        Args: Record<PropertyKey, never>
        Returns: {
          service: string
          visitors: number
          fill: string
        }[]
      }
      get_monthly_visitors: {
        Args: Record<PropertyKey, never>
        Returns: {
          service: string
          visitors: number
          fill: string
        }[]
      }
      get_recent_sales_by_staff: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
          image: string
          initials: string
          weeklyearnings: number
        }[]
      }
      get_recent_transactions: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer: string
          email: string
          staff: string
          service: string
          date: string
          amount: number
        }[]
      }
      get_reservation_count: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: {
          active: number
          passive: number
        }[]
      }
      get_services_with_subservices: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
          duration: number
          price: number
          sub_services: Json
        }[]
      }
      get_weekly_visitors: {
        Args: Record<PropertyKey, never>
        Returns: {
          service: string
          visitors: number
          fill: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
