"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const staffChartData = {
  daily: [
    { staff: "ahmet", appointments: 86, fill: "var(--color-staff1)" },
    { staff: "mehmet", appointments: 105, fill: "var(--color-staff2)" },
    { staff: "ayşe", appointments: 77, fill: "var(--color-staff3)" },
    { staff: "fatma", appointments: 63, fill: "var(--color-staff4)" },
    { staff: "zeynep", appointments: 89, fill: "var(--color-staff5)" },
  ],
  weekly: [
    { staff: "ahmet", appointments: 386, fill: "var(--color-staff1)" },
    { staff: "mehmet", appointments: 425, fill: "var(--color-staff2)" },
    { staff: "ayşe", appointments: 337, fill: "var(--color-staff3)" },
    { staff: "fatma", appointments: 293, fill: "var(--color-staff4)" },
    { staff: "zeynep", appointments: 359, fill: "var(--color-staff5)" },
  ],
  monthly: [
    { staff: "ahmet", appointments: 1286, fill: "var(--color-staff1)" },
    { staff: "mehmet", appointments: 1505, fill: "var(--color-staff2)" },
    { staff: "ayşe", appointments: 1137, fill: "var(--color-staff3)" },
    { staff: "fatma", appointments: 973, fill: "var(--color-staff4)" },
    { staff: "zeynep", appointments: 1209, fill: "var(--color-staff5)" },
  ],
}

const chartConfig = {
  appointments: {
    label: "Randevular",
    color: "transparent",
  },
  staff1: {
    label: "Ahmet",
    color: "hsl(var(--chart-1))",
  },
  staff2: {
    label: "Mehmet",
    color: "hsl(var(--chart-2))",
  },
  staff3: {
    label: "Ayşe",
    color: "hsl(var(--chart-3))",
  },
  staff4: {
    label: "Fatma",
    color: "hsl(var(--chart-4))",
  },
  staff5: {
    label: "Zeynep",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function StaffRateChart() {
  const id = "pie-interactive"
  const [activeStaff, setActiveStaff] = React.useState(staffChartData.daily[0].staff)
  const [activeTab, setActiveTab] = React.useState("daily")

  const activeIndex = React.useMemo(
    () => staffChartData[activeTab as keyof typeof staffChartData].findIndex((item) => item.staff === activeStaff),
    [activeStaff, activeTab]
  )
  const staffMembers = React.useMemo(() => staffChartData.daily.map((item) => item.staff), [])

  const renderChart = () => {
    return (
      <ChartContainer
        id={id}
        config={chartConfig}
        className="aspect-[4/1.8] w-full pt-0 px-4"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={staffChartData[activeTab as keyof typeof staffChartData]}
            dataKey="appointments"
            nameKey="staff"
            innerRadius={65}
            outerRadius={90}
            strokeWidth={1}
            activeIndex={activeIndex}
            activeShape={({
              outerRadius = 0,
              ...props
            }: PieSectorDataItem) => (
              <g>
                <Sector {...props} outerRadius={outerRadius + 8} />
                <Sector
                  {...props}
                  outerRadius={outerRadius + 20}
                  innerRadius={outerRadius + 10}
                />
              </g>
            )}
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
                        {staffChartData[activeTab as keyof typeof staffChartData][activeIndex].appointments.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Randevu
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Personel Randevu Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value="daily">Günlük</TabsTrigger>
            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly">Aylık</TabsTrigger>
          </TabsList>
          {Object.entries(staffChartData).map(([period]) => (
            <TabsContent key={period} value={period}>
              <div className="flex justify-end mb-4">
                <Select value={activeStaff} onValueChange={setActiveStaff}>
                  <SelectTrigger
                    className="h-8 w-[140px]"
                    aria-label="Personel seç"
                  >
                    <SelectValue placeholder="Personel seç" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {staffMembers.map((staff) => {
                      const staffKey = `staff${staffMembers.indexOf(staff) + 1}` as keyof typeof chartConfig
                      const config = chartConfig[staffKey]

                      if (!config) {
                        return null
                      }

                      return (
                        <SelectItem
                          key={staff}
                          value={staff}
                          className="rounded-lg [&_span]:flex"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className="flex h-3 w-3 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: config.color,
                              }}
                            />
                            {config.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              {renderChart()}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
