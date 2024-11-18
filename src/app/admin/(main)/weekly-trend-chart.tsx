"use client"

import React, { useEffect, useState } from 'react'
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"

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
  const [chartData, setChartData] = useState<ChartDataType[]>(initialChartData);

  useEffect(() => {
    const fetchDailyIncomeForWeeks = async () => {
      const data = await getDailyIncomeForWeeks();
      if (data) {
        setChartData(data);
      }
    }

    fetchDailyIncomeForWeeks();
  }, [])

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Wöchentlicher Trend</CardTitle>
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
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
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
            >
              <LabelList
                position="bottom"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}