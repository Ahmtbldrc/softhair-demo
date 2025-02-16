"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
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
import { useLocale } from "@/contexts/LocaleContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
}

export default function CustomerServiceChart() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = React.useState<keyof ChartData>("daily")
  const [activeService, setActiveService] = React.useState<string>("all")
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

    const processData = (data: { visitors: number; service: string }[]) => {
      return data.map((item, index) => ({
        ...item,
        fill: `hsl(var(--chart-${(index % 30) + 1}))`,
      }))
    }

    const processedDaily = processData(dailyData || [])
    const processedWeekly = processData(weeklyData || [])
    const processedMonthly = processData(monthlyData || [])

    setChartData({
      daily: processedDaily,
      weekly: processedWeekly,
      monthly: processedMonthly,
    })

    // İlk servisi seç
    if (processedDaily.length > 0 && !activeService) {
      setActiveService(processedDaily[0].service)
    }
  }

  const fetchServicesConfig = async () => {
    const { data: servicesData, error: servicesError } = await supabase.from('services').select('name')

    if (servicesError) {
      console.error('Error fetching services config:', servicesError)
      return
    }

    const config = servicesData.reduce((acc: Record<string, { label: string; color: string }>, service, index) => {
      acc[service.name] = {
        label: service.name,
        color: `hsl(var(--chart-${(index % 12) + 1}))`,
      }
      return acc
    }, {})

    setServicesConfig(config)
    fetchChartData()
  }

  React.useEffect(() => {
    // Önce servicesConfig'i yükleyelim
    fetchServicesConfig()
    // fetchChartData artık fetchServicesConfig içinden çağrılacak
  }, [])

  const totalVisitors = React.useMemo(() => {
    return chartData[activeTab].reduce((acc: number, curr: { visitors: number }) => acc + curr.visitors, 0)
  }, [activeTab, chartData])

  const activeIndex = React.useMemo(
    () => chartData[activeTab].findIndex((item) => item.service === activeService),
    [activeService, activeTab, chartData]
  )

  const availableServices = React.useMemo(() => {
    return chartData[activeTab]
      .filter(item => item.service !== "empty" && item.visitors > 0)
      .map(item => ({
        service: item.service,
        visitors: item.visitors
      }))
  }, [activeTab, chartData])

  const renderChart = () => {
    const emptyChartData = [{
      visitors: 1,
      service: "empty",
      fill: "hsl(var(--muted))"
    }]

    const currentData = totalVisitors === 0 
      ? emptyChartData 
      : chartData[activeTab].map((item, index) => ({
          ...item,
          fill: `hsl(var(--chart-${(index % 12) + 1}))`
        }))

    return (
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
            data={currentData}
            dataKey="visitors"
            nameKey="service"
            innerRadius={60}
            strokeWidth={5}
            activeIndex={activeIndex}
            activeShape={({
              outerRadius = 0,
              ...props
            }) => (
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
                        {totalVisitors.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        {t("customer-service.visitors")}
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
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("customer-service.customerServiceDistribution")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Tabs defaultValue="daily" value={activeTab} onValueChange={(value) => setActiveTab(value as keyof ChartData)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mt-3">
            <TabsTrigger value={AnalyticType.DAILY}>{t("customer-service.daily")}</TabsTrigger>
            <TabsTrigger value={AnalyticType.WEEKLY}>{t("customer-service.weekly")}</TabsTrigger>
            <TabsTrigger value={AnalyticType.MONTHLY}>{t("customer-service.monthly")}</TabsTrigger>
          </TabsList>
          {Object.entries(chartData).map(([period]) => (
            <TabsContent key={period} value={period}>
              <div className="flex justify-end mb-4">
                <Select 
                  value={activeService} 
                  onValueChange={setActiveService}
                >
                  <SelectTrigger
                    className="h-8 w-[140px]"
                    aria-label={t("customer-service.selectService")}
                  >
                    <SelectValue 
                      placeholder={t("customer-service.selectService")} 
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent 
                    align="end" 
                    className="max-h-[300px] min-w-[200px]"
                  >
                    <SelectItem
                      key="all"
                      value="all"
                      className="rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm bg-primary"
                        />
                        <span className="text-sm truncate">{t("customer-service.allServices")}</span>
                      </div>
                    </SelectItem>
                    {availableServices.map(({ service }) => {
                      const serviceIndex = chartData[activeTab].findIndex(item => item.service === service)
                      const color = `hsl(var(--chart-${(serviceIndex % 12) + 1}))`

                      return (
                        <SelectItem
                          key={service}
                          value={service}
                          className="rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: color,
                              }}
                            />
                            <span className="text-sm truncate">{service}</span>
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