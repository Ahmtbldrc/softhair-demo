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
import { getStaffAppointmentStatistics, type StaffAppointmentData } from "@/lib/services/staff.service"
import { useBranch } from "@/contexts/BranchContext"
import { useLocale } from "@/contexts/LocaleContext";

export function StaffRateChart() {
  const { selectedBranchId } = useBranch()
  const { t } = useLocale();
  const id = "pie-interactive"
  const [staffChartData, setStaffChartData] = React.useState<Record<string, StaffAppointmentData[]>>({
    daily: [],
    weekly: [],
    monthly: []
  })
  const [activeStaff, setActiveStaff] = React.useState<string>('')
  const [activeTab, setActiveTab] = React.useState("daily")
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({
    appointments: {
      label: "Randevular",
      color: "transparent",
    }
  })

  // Staff verilerini çek
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await getStaffAppointmentStatistics(selectedBranchId)
      setStaffChartData(data)

      if (data.daily.length > 0) {
        const firstStaffKey = `staff_${data.daily[0].staff.toLowerCase().replace(/\s+/g, '_')}`
        setActiveStaff(firstStaffKey)
      }
    }

    if (selectedBranchId > 0) {
      fetchData()
    }
  }, [selectedBranchId])

  // Chart config'i güncelle
  React.useEffect(() => {
    const newConfig: ChartConfig = {
      appointments: {
        label: t("appointments"),
        color: "transparent",
      }
    }

    staffChartData[activeTab].forEach((staff) => {
      const staffKey = `staff_${staff.staff.toLowerCase().replace(/\s+/g, '_')}`
      newConfig[staffKey] = {
        label: staff.staff,
        color: staff.fill
      }
    })

    setChartConfig(newConfig)
  }, [staffChartData, activeTab, t])

  const activeIndex = React.useMemo(
    () => {
      const staffName = activeStaff.split('_').slice(1).join('_')
      return staffChartData[activeTab as keyof typeof staffChartData]
        .findIndex((item) => item.staff.toLowerCase().replace(/\s+/g, '_') === staffName)
    },
    [activeStaff, activeTab, staffChartData]
  )

  const renderChart = () => {
    const currentData = staffChartData[activeTab as keyof typeof staffChartData].map(staff => ({
      ...staff,
      fill: chartConfig[`staff_${staff.staff.toLowerCase().replace(/\s+/g, '_')}`]?.color || 'transparent'
    }))

    return (
      <ChartContainer
        id={id}
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={currentData}
            dataKey="appointments"
            nameKey="staff"
            innerRadius={60}
            outerRadius={90}
            strokeWidth={5}
            activeIndex={activeIndex}
            fill="#000"
            activeShape={({
              outerRadius = 0,
              fill,
              ...props
            }: PieSectorDataItem) => (
              <g>
                <Sector {...props} outerRadius={outerRadius + 8} fill={fill} />
                <Sector
                  {...props}
                  outerRadius={outerRadius + 20}
                  innerRadius={outerRadius + 10}
                  fill={fill}
                />
              </g>
            )}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  const appointments = currentData[activeIndex]?.appointments || 0

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
                        {appointments.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        {t("staff-rate-chart.appointments")}
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
        <CardTitle>{t("staff-rate-chart.title")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value="daily">{t("staff-rate-chart.daily")}</TabsTrigger>
            <TabsTrigger value="weekly">{t("staff-rate-chart.weekly")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("staff-rate-chart.monthly")}</TabsTrigger>
          </TabsList>
          {Object.entries(staffChartData).map(([period]) => (
            <TabsContent key={period} value={period}>
              <div className="flex justify-end mb-4">
                <Select value={activeStaff} onValueChange={setActiveStaff}>
                  <SelectTrigger
                    className="h-8 w-[140px]"
                    aria-label={t("staff-rate-chart.selectStaff")}
                  >
                    <SelectValue placeholder={t("staff-rate-chart.selectStaff")} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {staffChartData[activeTab].map((staff) => {
                      const staffKey = `staff_${staff.staff.toLowerCase().replace(/\s+/g, '_')}` as keyof typeof chartConfig
                      const config = chartConfig[staffKey]

                      if (!config) {
                        return null
                      }

                      return (
                        <SelectItem
                          key={staffKey}
                          value={staffKey}
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
