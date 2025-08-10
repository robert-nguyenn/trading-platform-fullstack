"use client"

import type React from "react"

import { Search, Plus, TrendingUp, DollarSign, BarChart4, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export function EventLibrarySidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search events..." className="pl-8" />
        </div>
      </div>

      <Tabs defaultValue="macro" className="flex-1">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="macro" className="flex-1">
              Macro
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Custom
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">
              Saved
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="macro" className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Interest Rates</h3>
                <div className="space-y-2">
                  <EventCard
                    title="Fed Funds Rate Increase"
                    description="Federal Reserve increases interest rates"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                  <EventCard
                    title="Fed Funds Rate Decrease"
                    description="Federal Reserve decreases interest rates"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                  <EventCard
                    title="10Y Treasury Yield > 4%"
                    description="10-year Treasury yield rises above 4%"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Inflation</h3>
                <div className="space-y-2">
                  <EventCard
                    title="CPI YoY > 5.5%"
                    description="Consumer Price Index year-over-year above 5.5%"
                    icon={<DollarSign className="h-4 w-4" />}
                    highlighted
                  />
                  <EventCard
                    title="CPI MoM > 0.5%"
                    description="Consumer Price Index month-over-month above 0.5%"
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <EventCard
                    title="PCE > 3%"
                    description="Personal Consumption Expenditures above 3%"
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Economic Indicators</h3>
                <div className="space-y-2">
                  <EventCard
                    title="GDP Growth < 0"
                    description="Negative GDP growth for two consecutive quarters"
                    icon={<BarChart4 className="h-4 w-4" />}
                  />
                  <EventCard
                    title="Unemployment > 5%"
                    description="Unemployment rate rises above 5%"
                    icon={<BarChart4 className="h-4 w-4" />}
                  />
                  <EventCard
                    title="ISM Manufacturing < 50"
                    description="ISM Manufacturing PMI below 50 (contraction)"
                    icon={<BarChart4 className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Geopolitical</h3>
                <div className="space-y-2">
                  <EventCard
                    title="Oil Price > $100"
                    description="Crude oil price rises above $100 per barrel"
                    icon={<AlertCircle className="h-4 w-4" />}
                  />
                  <EventCard
                    title="New Sanctions"
                    description="New economic sanctions imposed on major economy"
                    icon={<AlertCircle className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="custom" className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No custom events yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Create your first custom event trigger</p>
                <Button className="mt-4 gap-1">
                  <Plus className="h-4 w-4" />
                  Create Custom Event
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="saved" className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Saved Events</h3>
                <div className="space-y-2">
                  <EventCard
                    title="CPI YoY > 5.5%"
                    description="Consumer Price Index year-over-year above 5.5%"
                    icon={<Star className="h-4 w-4 text-amber-500" />}
                    highlighted
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="border-t p-4">
        <Button className="w-full gap-1">
          <Plus className="h-4 w-4" />
          Create Custom Event
        </Button>
      </div>
    </div>
  )
}

interface EventCardProps {
  title: string
  description: string
  icon: React.ReactNode
  highlighted?: boolean
}

function EventCard({ title, description, icon, highlighted }: EventCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50 ${
        highlighted ? "border-blue-300 bg-blue-50/50" : ""
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          highlighted ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

