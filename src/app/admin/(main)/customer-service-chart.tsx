"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticType } from "@/lib/types"

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
}

export default function CustomerServiceChart() {
  const [activeTab, setActiveTab] = React.useState<keyof ChartData>("daily")
  type ChartData = {
    daily: { visitors: number; service: string, fill: string }[];
    weekly: { visitors: number; service: string, fill: string }[];
    monthly: { visitors: number; service: string, fill: string }[];
  };

  const [chartData, setChartData] = React.useState<ChartData>({
    daily: [],
    weekly: [],
    monthly: [],
  })
  const [servicesConfig, setServicesConfig] = React.useState<Record<string, { label: string; color: string }>>({})

  const fetchChartData = async () => {
    const { data: dailyData, error: dailyError } = await supabase.rpc('get_daily_visitors')
    const { data: weeklyData, error: weeklyError } = await supabase.rpc('get_weekly_visitors')
    const { data: monthlyData, error: monthlyError } = await supabase.rpc('get_monthly_visitors')

    if (dailyError || weeklyError || monthlyError) {
      console.error('Error fetching chart data:', dailyError || weeklyError || monthlyError)
      return
    }

    setChartData({
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    })
  }

  const fetchServicesConfig = async () => {
    const { data: servicesData, error: servicesError } = await supabase.from('services').select('name')

    if (servicesError) {
      console.error('Error fetching services config:', servicesError)
      return
    }

    const config = servicesData.reduce((acc: Record<string, { label: string; color: string }>, service) => {
      acc[service.name.replace(/[^a-zA-Z0-9]/g, '')] = {
      label: service.name,
      color: `hsl(var(--chart-${Object.keys(acc).length + 1}))`,
      }
      return acc
    }, {})

    setServicesConfig(config)
  }

  React.useEffect(() => {
    fetchChartData()
    fetchServicesConfig()
  }, [])

  const totalVisitors = React.useMemo(() => {
    return chartData[activeTab].reduce((acc: number, curr: { visitors: number }) => acc + curr.visitors, 0)
  }, [activeTab, chartData])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Customer Service Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Tabs defaultValue="daily" value={activeTab} onValueChange={(value) => setActiveTab(value as keyof ChartData)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value={AnalyticType.DAILY}>Daily</TabsTrigger>
            <TabsTrigger value={AnalyticType.WEEKLY}>Weekly</TabsTrigger>
            <TabsTrigger value={AnalyticType.MONTHLY}>Monthly</TabsTrigger>
          </TabsList>
          {Object.entries(chartData).map(([period, data]) => (
            <TabsContent key={period} value={period}>
              <ChartContainer
                config={{ ...chartConfig, ...servicesConfig }}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={data}
                    dataKey="visitors"
                    nameKey="service"
                    innerRadius={60}
                    strokeWidth={5}
                  >
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
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalVisitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Visitors
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}