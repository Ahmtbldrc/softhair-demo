import React from "react";
import CustomerServiceChart from "./customer-service-chart";
import { TotalAppointmentChart } from "./total-appointment-chart";
import { WeeklyTrendChart } from "./weekly-trend-chart";
import TransactionsChart from "./transactions-chart";
import StaffWeeklyTrendChart from "./staff-weekly-trend-chart";
import { StaffRateChart } from "./staff-rate-chart";
export default function AdminHome() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* <h1 className="text-3xl font-bold text-primary">Dashboard </h1> */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StaffRateChart />
          {/*<OccupancyRateChart />*/}
          <CustomerServiceChart />
          <TotalAppointmentChart />
          <WeeklyTrendChart />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <TransactionsChart />
          <StaffWeeklyTrendChart />
        </div>
      </main>
    </div>
  );
}
