// "use client"

// import { useState } from "react"
// import { Plus, AlertCircle, DollarSign, Percent, BarChart3 } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader } from "@/components/ui/card"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"

// export function StrategyBuilder() {
//   const [viewMode, setViewMode] = useState<"logic" | "timeline">("logic")

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "logic" | "timeline")} className="w-auto">
//             <TabsList>
//               <TabsTrigger value="logic">Logic View</TabsTrigger>
//               <TabsTrigger value="timeline">Timeline View</TabsTrigger>
//             </TabsList>
//           </Tabs>
//         </div>
//         <Button variant="outline" size="sm" className="gap-1">
//           <BarChart3 className="h-4 w-4" />
//           Create with AI
//         </Button>
//       </div>

//       {viewMode === "logic" ? <LogicView /> : <TimelineView />}
//     </div>
//   )
// }

// function LogicView() {
//   return (
//     <div className="space-y-4">
//       <EventTriggerBlock />
//     </div>
//   )
// }

// function TimelineView() {
//   return (
//     <div className="space-y-4">
//       <Card>
//         <CardHeader className="pb-2">
//           <h3 className="text-lg font-medium">Strategy Timeline</h3>
//           <p className="text-sm text-muted-foreground">View your strategy as a timeline of events</p>
//         </CardHeader>
//         <CardContent>
//           <div className="relative">
//             <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

//             <div className="mb-8 ml-10 relative">
//               <div className="absolute -left-8 top-1 h-4 w-4 rounded-full bg-blue-500"></div>
//               <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <h4 className="font-medium">CPI Inflation YoY &gt; 5.5%</h4>
//                   <Badge variant="outline" className="text-blue-500 border-blue-500">
//                     Event Trigger
//                   </Badge>
//                 </div>
//                 <p className="text-sm text-muted-foreground">Last triggered: March 15, 2023</p>
//                 <div className="rounded-md border p-3 mt-2">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Badge className="bg-orange-500">Portfolio Group</Badge>
//                     <h5 className="font-medium">Inflation Hedge Assets</h5>
//                   </div>
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between text-sm">
//                       <div className="flex items-center gap-2">
//                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
//                           Long
//                         </Badge>
//                         <span>XLE - Energy Select Sector SPDR Fund</span>
//                       </div>
//                       <span className="font-medium">30%</span>
//                     </div>
//                     <div className="flex items-center justify-between text-sm">
//                       <div className="flex items-center gap-2">
//                         <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
//                           Short
//                         </Badge>
//                         <span>TLT - iShares 20+ Year Treasury Bond ETF</span>
//                       </div>
//                       <span className="font-medium">70%</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="ml-10 relative">
//               <div className="absolute -left-8 top-1 h-4 w-4 rounded-full bg-slate-300"></div>
//               <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <h4 className="font-medium">CPI Inflation YoY ≤ 5.5%</h4>
//                   <Badge variant="outline" className="text-slate-500 border-slate-300">
//                     Else Condition
//                   </Badge>
//                 </div>
//                 <p className="text-sm text-muted-foreground">Last active: January 10, 2023</p>
//                 <div className="rounded-md border p-3 mt-2">
//                   <div className="flex items-center gap-2">
//                     <Badge className="bg-green-500">Asset</Badge>
//                     <h5 className="font-medium">SPY - SPDR S&P 500 ETF Trust</h5>
//                     <span className="text-sm font-medium ml-auto">100%</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// function EventTriggerBlock() {
//   return (
//     <div className="space-y-2">
//       <Card className="border-blue-200 bg-blue-50/50">
//         <CardHeader className="flex flex-row items-center justify-between pb-2">
//           <div className="flex items-center gap-2">
//             <Badge className="bg-blue-500">Event Trigger</Badge>
//             <h3 className="font-medium">CPI Inflation YoY &gt; 5.5%</h3>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="flex items-center gap-1">
//               <Switch id="monitor-event" />
//               <Label htmlFor="monitor-event" className="text-xs">
//                 Monitor This Event
//               </Label>
//             </div>
//             <Button variant="ghost" size="icon" className="h-8 w-8">
//               <AlertCircle className="h-4 w-4" />
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="ml-6 space-y-4">
//             <div className="flex items-center gap-2">
//               <Badge className="bg-blue-500/20 text-blue-700">THEN</Badge>
//               <PortfolioGroupBlock />
//             </div>

//             <div className="flex items-center gap-2">
//               <Badge className="bg-slate-200 text-slate-700">ELSE</Badge>
//               <AssetBlock />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <div className="flex justify-center">
//         <AddBlockButton />
//       </div>
//     </div>
//   )
// }

// function PortfolioGroupBlock() {
//   return (
//     <Card className="w-full border-orange-200 bg-orange-50/50">
//       <CardHeader className="flex flex-row items-center justify-between pb-2">
//         <div className="flex items-center gap-2">
//           <Badge className="bg-orange-500">Portfolio Group</Badge>
//           <h3 className="font-medium">Inflation Hedge Assets</h3>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="ml-6 space-y-2">
//           <div className="flex items-center justify-between rounded-md border p-2">
//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
//                 Long
//               </Badge>
//               <span>XLE - Energy Select Sector SPDR Fund</span>
//             </div>
//             <Badge variant="outline" className="font-medium">
//               30%
//             </Badge>
//           </div>

//           <div className="flex items-center justify-between rounded-md border p-2">
//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
//                 Short
//               </Badge>
//               <span>TLT - iShares 20+ Year Treasury Bond ETF</span>
//             </div>
//             <Badge variant="outline" className="font-medium">
//               70%
//             </Badge>
//           </div>

//           <div className="flex justify-center">
//             <AddBlockButton />
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// function AssetBlock() {
//   return (
//     <Card className="w-full border-green-200 bg-green-50/50">
//       <CardHeader className="flex flex-row items-center justify-between pb-2">
//         <div className="flex items-center gap-2">
//           <Badge className="bg-green-500">Asset</Badge>
//           <h3 className="font-medium">SPY - SPDR S&P 500 ETF Trust</h3>
//         </div>
//         <Badge variant="outline" className="font-medium">
//           100%
//         </Badge>
//       </CardHeader>
//     </Card>
//   )
// }

// function AddBlockButton() {
//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <Button variant="outline" size="sm" className="gap-1">
//           <Plus className="h-4 w-4" />
//           Add a Block
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-80">
//         <div className="grid gap-4">
//           <div className="space-y-2">
//             <h4 className="font-medium">Add Block</h4>
//             <p className="text-sm text-muted-foreground">Select a block type to add to your strategy</p>
//           </div>
//           <div className="grid gap-2">
//             <Button variant="outline" className="justify-start gap-2 text-left">
//               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
//                 <AlertCircle className="h-4 w-4" />
//               </div>
//               <div className="flex flex-col items-start">
//                 <span>Event Trigger</span>
//                 <span className="text-xs text-muted-foreground">Define macro or geopolitical events as triggers</span>
//               </div>
//             </Button>

//             <Button variant="outline" className="justify-start gap-2 text-left">
//               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-green-700">
//                 <DollarSign className="h-4 w-4" />
//               </div>
//               <div className="flex flex-col items-start">
//                 <span>Asset / Instrument</span>
//                 <span className="text-xs text-muted-foreground">Add stocks, ETFs, or other instruments</span>
//               </div>
//             </Button>

//             <Button variant="outline" className="justify-start gap-2 text-left">
//               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100 text-orange-700">
//                 <BarChart3 className="h-4 w-4" />
//               </div>
//               <div className="flex flex-col items-start">
//                 <span>Portfolio Group</span>
//                 <span className="text-xs text-muted-foreground">
//                   Organize assets by placing them inside a named group
//                 </span>
//               </div>
//             </Button>

//             <Button variant="outline" className="justify-start gap-2 text-left">
//               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-700">
//                 <Percent className="h-4 w-4" />
//               </div>
//               <div className="flex flex-col items-start">
//                 <span>Weight / Exposure</span>
//                 <span className="text-xs text-muted-foreground">Decide how funds are allocated to assets</span>
//               </div>
//             </Button>

//             <Button variant="outline" className="justify-start gap-2 text-left">
//               <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
//                 <BarChart3 className="h-4 w-4" />
//               </div>
//               <div className="flex flex-col items-start">
//                 <span>Metric Filter</span>
//                 <span className="text-xs text-muted-foreground">Sort and filter assets by their attributes</span>
//               </div>
//             </Button>
//           </div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   )
// }

