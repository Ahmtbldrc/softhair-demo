"use client"

import * as React from "react"
import { TrendingUp } from 'lucide-react'
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const chartData = {
  daily: [
    { service: "Gesichtsbacke & Augenbrauen", visitors: 75, fill: "var(--color-GesichtsbackeAugenbrauen)" },
    { service: "Bartrasur", visitors: 50, fill: "var(--color-Bartrasur)" },
    { service: "Unique Hair Cut	", visitors: 87, fill: "var(--color-UniqueHairCut)" },
  ],
  weekly: [
    { service: "Gesichtsbacke & Augenbrauen", visitors: 750, fill: "var(--color-GesichtsbackeAugenbrauen)" },
    { service: "Bartrasur", visitors: 350, fill: "var(--color-Bartrasur)" },
    { service: "Unique Hair Cut	", visitors: 609, fill: "var(--color-UniqueHairCut)" },
  ],
  monthly: [
    { service: "Gesichtsbacke & Augenbrauen", visitors: 6000, fill: "var(--color-GesichtsbackeAugenbrauen)" },
    { service: "Bartrasur", visitors: 1500, fill: "var(--color-Bartrasur)" },
    { service: "Unique Hair Cut", visitors: 2637, fill: "var(--color-UniqueHairCut)" },
  ],
}

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  GesichtsbackeAugenbrauen: {
    label: "Gesichtsbacke & Augenbrauen ",
    color: "hsl(var(--chart-1))",
  },
  Bartrasur: {
    label: "Bartrasur ",
    color: "hsl(var(--chart-2))",
  },
  UniqueHairCut	: {
    label: "Unique Hair Cut ",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function CustomerServiceChart() {
  const [activeTab, setActiveTab] = React.useState("daily")

  const totalVisitors = React.useMemo(() => {
    return chartData[activeTab as keyof typeof chartData].reduce((acc, curr) => acc + curr.visitors, 0)
  }, [activeTab])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Customer Service Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          {Object.entries(chartData).map(([period, data]) => (
            <TabsContent key={period} value={period}>
              <ChartContainer
                config={chartConfig}
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
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this {activeTab.slice(0, -2)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last {activeTab === 'daily' ? 'day' : activeTab === 'weekly' ? 'week' : 'month'}
        </div>
      </CardFooter> */}
    </Card>
  )
}