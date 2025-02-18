import { type Database } from "./database.types"

// Database view types
export type StaffAppointmentStatistics = Database["public"]["Views"]["staff_appointment_statistics"]["Row"]
export type ServiceAppointmentStatistics = Database["public"]["Views"]["service_appointment_statistics"]["Row"]
export type AdminEmails = Database["public"]["Views"]["admin_emails"]["Row"]
export type DailyIncomeForWeeksByBranch = Database["public"]["Views"]["daily_income_for_weeks_by_branch_view"]["Row"]
export type RecentSalesByStaffView = Database["public"]["Views"]["recent_sales_by_staff_view"]["Row"]
export type RecentTransactionsView = Database["public"]["Views"]["recent_transactions_view"]["Row"]
export type ReservationCountView = Database["public"]["Views"]["reservation_count_view"]["Row"]

// Database table types
export type Branch = Database["public"]["Tables"]["branches"]["Row"]
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
export type Service = Database["public"]["Tables"]["services"]["Row"]
export type Staff = Database["public"]["Tables"]["staff"]["Row"]
export type StaffService = Database["public"]["Tables"]["staff_services"]["Row"]

// Composite types
export type ReservationWithDetails = Reservation & {
    service: Service;
    staff: Staff;
    branch: Branch;
}

// Insert types
export type BranchInsert = Database["public"]["Tables"]["branches"]["Insert"]
export type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"]
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"]
export type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"]
export type StaffServiceInsert = Database["public"]["Tables"]["staff_services"]["Insert"]

// Update types
export type BranchUpdate = Database["public"]["Tables"]["branches"]["Update"]
export type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"]
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"]
export type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"]
export type StaffServiceUpdate = Database["public"]["Tables"]["staff_services"]["Update"]

// Function return types
export type DailyOccupancy = Database["public"]["Functions"]["calculate_daily_occupancy"]["Returns"]
export type OverallOccupancy = Database["public"]["Functions"]["calculate_overall_occupancy"]["Returns"]
export type DailyIncomeForWeeks = Database["public"]["Functions"]["get_daily_income_for_weeks"]["Returns"]
export type DailyVisitors = Database["public"]["Functions"]["get_daily_visitors"]["Returns"]
export type MonthlyVisitors = Database["public"]["Functions"]["get_monthly_visitors"]["Returns"]
export type WeeklyVisitors = Database["public"]["Functions"]["get_weekly_visitors"]["Returns"]
export type RecentSalesByStaff = Database["public"]["Functions"]["get_recent_sales_by_staff"]["Returns"]
export type RecentTransactions = Database["public"]["Functions"]["get_recent_transactions"]["Returns"]
export type ReservationCount = Database["public"]["Functions"]["get_reservation_count"]["Returns"]
