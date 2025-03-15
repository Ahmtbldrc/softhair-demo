"use client"

import React, { useState, useEffect } from "react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticType } from "@/lib/types"
import { getReservationCountFromView } from "@/lib/services/reservation.service"
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from "@/contexts/BranchContext";

// define ChartDataType from chartData object
type ChartDataType = {
  daily: { period: AnalyticType, active: number, passive: number, empty: number }[],
  weekly: { period: AnalyticType, active: number, passive: number, empty: number }[],
  monthly: { period: AnalyticType, active: number, passive: number, empty: number }[]
}

const initialChartData: ChartDataType = {
  daily: [{ period: AnalyticType.DAILY, active: 0, passive: 0, empty: 100 }],
  weekly: [{ period: AnalyticType.WEEKLY, active: 0, passive: 0, empty: 100 }],
  monthly: [{ period: AnalyticType.MONTHLY, active: 0, passive: 0, empty: 100 }],
}

const chartConfig = {
    active: {
    label: "active",
    color: "hsl(var(--chart-2))",
  },
  passive: {
    label: "canceled",
    color: "hsl(var(--chart-5))",
  },
  empty: {
    label: "",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

export function TotalAppointmentChart() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [activeTab, setActiveTab] = useState<AnalyticType>(AnalyticType.DAILY)
  const [chartData, setChartData] = useState<ChartDataType>(initialChartData);

  const totalVisitors = React.useMemo(() => {
    const data = chartData[activeTab as keyof typeof chartData][0]
    return data.active + data.passive
  }, [activeTab, chartData])

  useEffect(() => {
    const fetchReservationCount = async () => {
      if (selectedBranchId <= 0) return;
      
      const result = await getReservationCountFromView(selectedBranchId);
      if (!result.data) return;

      setChartData({
        daily: [{ 
          period: AnalyticType.DAILY, 
          active: result.data.dailyActiveCount || 0, 
          passive: result.data.dailyPassiveCount || 0,
          empty: (result.data.dailyActiveCount || 0) + (result.data.dailyPassiveCount || 0) === 0 ? 100 : 0 
        }],
        weekly: [{ 
          period: AnalyticType.WEEKLY, 
          active: result.data.weeklyActiveCount || 0, 
          passive: result.data.weeklyPassiveCount || 0,
          empty: (result.data.weeklyActiveCount || 0) + (result.data.weeklyPassiveCount || 0) === 0 ? 100 : 0 
        }],
        monthly: [{ 
          period: AnalyticType.MONTHLY, 
          active: result.data.monthlyActiveCount || 0, 
          passive: result.data.monthlyPassiveCount || 0,
          empty: (result.data.monthlyActiveCount || 0) + (result.data.monthlyPassiveCount || 0) === 0 ? 100 : 0 
        }]
      });
    }
    fetchReservationCount();
  }, [selectedBranchId])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("total-appointment.totalAppointments")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Tabs defaultValue={AnalyticType.DAILY} value={activeTab} onValueChange={value => setActiveTab(value as AnalyticType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value={AnalyticType.DAILY}>{t("total-appointment.daily")}</TabsTrigger>
            <TabsTrigger value={AnalyticType.WEEKLY}>{t("total-appointment.weekly")}</TabsTrigger>
            <TabsTrigger value={AnalyticType.MONTHLY}>{t("total-appointment.monthly")}</TabsTrigger>
          </TabsList>
          {Object.entries(chartData).map(([period, data]) => (
            <TabsContent key={period} value={period}>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-full max-w-[250px]"
              >
                <RadialBarChart
                  data={data}
                  endAngle={180}
                  innerRadius={80}
                  outerRadius={130}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 16}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalVisitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 4}
                                className="fill-muted-foreground"
                              >
                                {t("total-appointment.visitors")}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                  <RadialBar
                    dataKey="active"
                    stackId="a"
                    cornerRadius={5}
                    fill="var(--color-active)"
                    className="stroke-transparent stroke-2"
                  />
                  <RadialBar
                    dataKey="passive"
                    fill="var(--color-passive)"
                    stackId="a"
                    cornerRadius={5}
                    className="stroke-transparent stroke-2"
                  />
                  <RadialBar
                    dataKey="empty"
                    fill="var(--color-empty)"
                    stackId="a"
                    cornerRadius={5}
                    className="stroke-transparent stroke-2"
                    isAnimationActive={false}
                    name=""
                  />
                </RadialBarChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}