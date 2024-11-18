"use client"

import * as React from "react"
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

const chartData = {
  daily: [{ period: "daily", aktiv: 18, passiv: 2 }],
  weekly: [{ period: "weekly", aktiv: 205, passiv: 20 }],
  monthly: [{ period: "monthly", aktiv: 1200, passiv: 240 }],
}

const chartConfig = {
    aktiv: {
    label: "aktiv",
    color: "hsl(var(--chart-2))",
  },
  passiv: {
    label: "passiv",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function TotalAppointmentChart() {
  const [activeTab, setActiveTab] = React.useState("daily")

  const totalVisitors = React.useMemo(() => {
    const data = chartData[activeTab as keyof typeof chartData][0]
    return data.aktiv + data.passiv
  }, [activeTab])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Anzahl der Termine</CardTitle>
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
                                Visitors
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                  <RadialBar
                    dataKey="aktiv"
                    stackId="a"
                    cornerRadius={5}
                    fill="var(--color-aktiv)"
                    className="stroke-transparent stroke-2"
                  />
                  <RadialBar
                    dataKey="passiv"
                    fill="var(--color-passiv)"
                    stackId="a"
                    cornerRadius={5}
                    className="stroke-transparent stroke-2"
                  />
                </RadialBarChart>
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