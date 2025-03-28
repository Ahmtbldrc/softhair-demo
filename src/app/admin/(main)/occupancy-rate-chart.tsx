"use client"

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useLocale } from "@/contexts/LocaleContext";


const chartData = {
  monthly: [{ visitors: 15000, fill: "var(--color-monthly)" }],
  weekly: [{ visitors: 3500, fill: "var(--color-weekly)" }],
  daily: [{ visitors: 500, fill: "var(--color-daily)" }],
}

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  monthly: {
    label: "Monthly",
    color: "hsl(var(--chart-2))",
  },
  weekly: {
    label: "Weekly",
    color: "hsl(var(--chart-3))",
  },
  daily: {
    label: "Daily",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export default function OccupancyRate() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState("monthly")
  // const [chartData, setChartData] = useState();

// Günlük, haftalık ve aylık doluluk oranlarını hesaplamak için işlevler
 const getOccupancyRates = async () => {
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('id, weeklyHours');

  if (staffError) {
    console.error('Staff verisi alınırken hata:', staffError);
    return;
  }

  const results = [];

  // Günlük, haftalık, ve aylık doluluk oranlarını hesapla
  for (const staff of staffData) {
    const staffId = staff.id;

    // Günlük Doluluk Oranı Hesaplama
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('calculate_daily_occupancy', { staff_id: staffId });

    if (dailyError) {
      console.error('Günlük doluluk oranı hesaplanırken hata:', dailyError);
    }

    // Haftalık Doluluk Oranı Hesaplama
    const { data: weeklyData, error: weeklyError } = await supabase
      .rpc('calculate_weekly_occupancy', { staff_id: staffId });

    if (weeklyError) {
      console.error('Haftalık doluluk oranı hesaplanırken hata:', weeklyError);
    }

    // Aylık Doluluk Oranı Hesaplama
    const { data: monthlyData, error: monthlyError } = await supabase
      .rpc('calculate_monthly_occupancy', { staff_id: staffId });

    if (monthlyError) {
      console.error('Aylık doluluk oranı hesaplanırken hata:', monthlyError);
    }
    
    results.push({
      staffId: staffId,
      dailyOccupancy: dailyData,
      weeklyOccupancy: weeklyData,
      monthlyOccupancy: monthlyData,
    });
  }

}
  useEffect(() => {

    getOccupancyRates();
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("occupancy-rate.occupancyRate")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value="daily">{t("occupancy-rate.daily")}</TabsTrigger>
            <TabsTrigger value="weekly">{t("occupancy-rate.weekly")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("occupancy-rate.monthly")}</TabsTrigger>
          </TabsList>
          {Object.entries(chartData).map(([period, data]) => (
            <TabsContent key={period} value={period}>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={data}
                  endAngle={100}
                  innerRadius={80}
                  outerRadius={140}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar dataKey="visitors" background />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-4xl font-bold"
                              >
                                {data[0].visitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                {t("occupancy-rate.visitors")}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}