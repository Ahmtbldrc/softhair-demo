"use client"

import React, { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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
import { getDailyIncomeForWeeks } from '@/lib/services/reservation.service'
import { useLocale } from "@/contexts/LocaleContext";
import { useBranch } from '@/contexts/BranchContext';

type ChartDataType = {
  day: string;
  thisWeek: number;
  lastWeek: number;
}

const initialChartData: ChartDataType[] = [
  { day: "Monday", thisWeek: 0, lastWeek: 0 },
  { day: "Tuesday", thisWeek: 0, lastWeek: 0 },
  { day: "Wednesday", thisWeek: 0, lastWeek: 0 },
  { day: "Thursday", thisWeek: 0, lastWeek: 0 },
  { day: "Friday", thisWeek: 0, lastWeek: 0 },
  { day: "Saturday", thisWeek: 0, lastWeek: 0 },
  { day: "Sunday", thisWeek: 0, lastWeek: 0 },
]

const chartConfig = {
  thisWeek: {
    label: "This Week",
    color: "hsl(var(--chart-1))",
  },
  lastWeek: {
    label: "Last Week",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function WeeklyTrendChart() {
  const { t } = useLocale();
  const { selectedBranchId } = useBranch();
  const [chartData, setChartData] = useState<ChartDataType[]>(initialChartData);

  useEffect(() => {
    const fetchDailyIncomeForWeeks = async () => {
      if (selectedBranchId <= 0) return;
      
      const data = await getDailyIncomeForWeeks(selectedBranchId);
      if (data) {
        setChartData(data);
      }
    }

    fetchDailyIncomeForWeeks();
  }, [selectedBranchId])

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{t("weekly-trend.weeklyTrend")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="thisWeek"
              type="natural"
              stroke="var(--color-thisWeek)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-thisWeek)",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="lastWeek"
              type="natural"
              stroke="var(--color-lastWeek)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-lastWeek)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}