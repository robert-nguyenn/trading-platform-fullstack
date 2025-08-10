"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import "./ticker.css" // We'll create this file next
import {
  Send,
  Mic,
  Upload,
  ChevronRight,
  ChevronLeft,
  BookmarkPlus,
  BarChart2,
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  Globe,
  Twitter,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Save,
  Clock,
  Sparkles,
  Zap,
  PieChart,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Filter,
  Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

// Add this import at the top of the file
import { EnhancedTicker } from "./enhanced-ticker"

// Mock data for demonstration
const WATCHLIST_ITEMS = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 182.34,
    change: 1.2,
    changePercent: 0.66,
    sparkline: [175, 176, 178, 177, 179, 180, 181, 182],
    volume: "32.5M",
    pe: 28.4,
    marketCap: "2.87T",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 334.78,
    change: -0.8,
    changePercent: -0.24,
    sparkline: [336, 335, 337, 336, 335, 334, 333, 334],
    volume: "22.1M",
    pe: 32.6,
    marketCap: "2.49T",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 842.56,
    change: 12.3,
    changePercent: 1.48,
    sparkline: [820, 825, 830, 835, 840, 838, 845, 842],
    volume: "45.7M",
    pe: 72.3,
    marketCap: "2.08T",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 177.89,
    change: -2.1,
    changePercent: -1.17,
    sparkline: [182, 180, 179, 178, 176, 177, 175, 177],
    volume: "38.2M",
    pe: 45.8,
    marketCap: "565.3B",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 178.15,
    change: 0.5,
    changePercent: 0.28,
    sparkline: [177, 177.5, 178, 177.8, 178.2, 178.5, 178.1, 178.15],
    volume: "29.8M",
    pe: 39.2,
    marketCap: "1.85T",
  },
]

const MARKET_INDICES = [
  { name: "S&P 500", value: "4,587.64", change: "+0.5%", sparkline: [4550, 4560, 4570, 4565, 4580, 4585, 4587] },
  { name: "Nasdaq", value: "14,346.02", change: "+0.7%", sparkline: [14250, 14280, 14300, 14320, 14340, 14346] },
  { name: "Dow Jones", value: "36,124.56", change: "+0.3%", sparkline: [36050, 36080, 36100, 36090, 36110, 36124] },
  { name: "VIX", value: "18.24", change: "-2.1%", sparkline: [19.5, 19.2, 18.9, 18.6, 18.4, 18.24] },
]

const NEWS_ITEMS = [
  {
    id: "1",
    title: "Fed signals potential rate cuts in coming months",
    source: "Financial Times",
    time: "2h ago",
    sentiment: "neutral",
    impact: "high",
  },
  {
    id: "2",
    title: "Tech stocks rally as inflation data comes in lower than expected",
    source: "Bloomberg",
    time: "4h ago",
    sentiment: "positive",
    impact: "medium",
  },
  {
    id: "3",
    title: "NVIDIA reports record quarterly earnings, beats estimates",
    source: "CNBC",
    time: "6h ago",
    sentiment: "positive",
    impact: "high",
  },
  {
    id: "4",
    title: "Oil prices drop amid concerns over global demand",
    source: "Reuters",
    time: "8h ago",
    sentiment: "negative",
    impact: "medium",
  },
]

const SAVED_PROMPTS = [
  { id: "1", text: "Analyze $AAPL earnings vs expectations" },
  { id: "2", text: "Compare $TSLA to $NIO Q1 performance" },
  { id: "3", text: "Summarize market sentiment on crypto" },
  { id: "4", text: "Explain impact of recent Fed decision on tech stocks" },
]

const SUGGESTED_PROMPTS = [
  "Analyze $AAPL earnings report",
  "Compare $TSLA to $NIO Q1 performance",
  "Summarize market sentiment on crypto",
  "What are the top performing sectors today?",
  "Explain the impact of recent Fed decisions on tech stocks",
]

// Mock conversation for demonstration
const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "👋 Welcome to your AI Trading Copilot! I can help you analyze stocks, understand market trends, and provide insights to inform your trading decisions. What would you like to know today?",
    timestamp: new Date().toISOString(),
  },
]

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  citations?: {
    text: string
    url: string
    source: string
  }[]
  thinking?: boolean
  chart?: {
    type: string
    data: any
  }
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState("watchlist")
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    // Simulate AI thinking and response
    setTimeout(() => {
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}`,
        role: "assistant",
        content: "Analyzing market data...",
        timestamp: new Date().toISOString(),
        thinking: true,
      }

      setMessages((prev) => [...prev, thinkingMessage])

      // Simulate AI response after thinking
      setTimeout(() => {
        setIsThinking(false)
        setMessages((prev) => {
          // Remove thinking message
          const filteredMessages = prev.filter((msg) => !msg.thinking)

          // Add AI response
          let responseContent = ""
          let citations = undefined
          let chart = undefined

          if (input.toLowerCase().includes("aapl") || input.toLowerCase().includes("apple")) {
            responseContent =
              "Based on my analysis of Apple's recent earnings report, the company exceeded expectations with revenue of $89.5 billion and EPS of $1.46. iPhone sales were particularly strong, showing 6% YoY growth despite supply chain challenges.\n\nThe services segment continues to be a bright spot, growing 16% YoY and now representing 26% of total revenue. This higher-margin business is positively impacting overall profitability.\n\nLooking forward, management provided positive guidance for the holiday quarter, though they noted some uncertainty around macroeconomic conditions."
            citations = [
              {
                text: "Apple Q3 2023 Earnings Report",
                url: "https://investor.apple.com/earnings/",
                source: "Apple Investor Relations",
              },
              {
                text: "Analyst Consensus Estimates",
                url: "https://www.bloomberg.com/markets/stocks/",
                source: "Bloomberg Terminal",
              },
            ]
            chart = {
              type: "earnings",
              data: {
                labels: ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"],
                actual: [1.29, 1.52, 1.46, 1.39],
                expected: [1.27, 1.43, 1.39, 1.35],
              },
            }
          } else if (input.toLowerCase().includes("market") || input.toLowerCase().includes("trend")) {
            responseContent =
              "Current market trends show a rotation from growth to value stocks as interest rates remain elevated. The S&P 500 is up 2.3% over the past month, while the Nasdaq has gained 1.8%.\n\nSector performance varies significantly:\n• Energy: +5.2%\n• Financials: +3.7%\n• Technology: +1.2%\n• Consumer Discretionary: -0.8%\n\nSmall caps are underperforming large caps, with the Russell 2000 down 1.5% MTD. This suggests investors are favoring established companies with strong balance sheets in the current economic environment."
            citations = [
              {
                text: "S&P 500 Performance Data",
                url: "https://www.spglobal.com/spdji/en/indices/equity/sp-500/",
                source: "S&P Global",
              },
              {
                text: "Sector Performance Analysis",
                url: "https://www.morningstar.com/markets/",
                source: "Morningstar",
              },
            ]
            chart = {
              type: "sectors",
              data: {
                sectors: ["Energy", "Financials", "Technology", "Healthcare", "Cons. Disc."],
                performance: [5.2, 3.7, 1.2, 0.5, -0.8],
              },
            }
          } else {
            responseContent =
              "I've analyzed your query and found some interesting insights. The current market environment shows mixed signals, with growth stocks facing pressure from higher interest rates while value stocks are showing resilience.\n\nVolatility has increased in recent sessions, with the VIX index up 15% from last month. This suggests investors are hedging against potential downside risks.\n\nTrading volumes are below average, which typically indicates uncertainty among market participants. In such environments, it's often prudent to maintain diversification and avoid overexposure to any single sector or asset class."
          }

          return [
            ...filteredMessages,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: responseContent,
              timestamp: new Date().toISOString(),
              citations,
              chart,
            },
          ]
        })
      }, 2000)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In a real implementation, this would start/stop voice recording
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render mini sparkline chart
  const renderSparkline = (data: number[], color: string, height = 20) => {
    if (!data || data.length < 2) return null

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min
    const width = data.length * 3

    // Calculate points for the polyline
    const points = data
      .map((value, index) => {
        const x = (index * width) / (data.length - 1)
        const y = height - ((value - min) / range) * height
        return `${x},${y}`
      })
      .join(" ")

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Render chart for message
  const renderChart = (chart: { type: string; data: any }) => {
    if (chart.type === "earnings") {
      const { labels, actual, expected } = chart.data

      return (
        <div className="mt-4 p-4 bg-card/50 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-sm">Quarterly EPS Performance</h4>
            <Badge variant="outline" className="text-xs">
              Earnings
            </Badge>
          </div>
          <div className="h-[200px] relative">
            <div className="absolute inset-0">
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-dashed border-muted-foreground/20"
                  style={{ top: `${i * 25}%` }}
                />
              ))}

              {/* Bars */}
              <div className="absolute inset-0 flex justify-around items-end pt-8">
                {labels.map((label: string, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-1 w-16">
                    <div className="flex gap-1 h-[150px] items-end">
                      <div className="w-5 bg-primary/80 rounded-t" style={{ height: `${(actual[i] / 2) * 100}px` }} />
                      <div
                        className="w-5 bg-muted-foreground/30 rounded-t"
                        style={{ height: `${(expected[i] / 2) * 100}px` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute top-2 right-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary/80 rounded-sm" />
                  <span className="text-xs">Actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-muted-foreground/30 rounded-sm" />
                  <span className="text-xs">Expected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (chart.type === "sectors") {
      const { sectors, performance } = chart.data

      return (
        <div className="mt-4 p-4 bg-card/50 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-sm">Sector Performance (MTD)</h4>
            <Badge variant="outline" className="text-xs">
              Market
            </Badge>
          </div>
          <div className="space-y-3">
            {sectors.map((sector: string, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{sector}</span>
                  <span className={`text-sm ${performance[i] >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {performance[i] >= 0 ? "+" : ""}
                    {performance[i]}%
                  </span>
                </div>
                <Progress
                  value={50 + performance[i] * 5}
                  className={`h-2 ${performance[i] >= 0 ? "bg-muted [&>div]:bg-green-500" : "bg-muted [&>div]:bg-red-500"}`}
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className={`flex h-[calc(100vh-3.5rem)] overflow-hidden ${fullscreenMode ? "fixed inset-0 z-50 bg-background" : ""}`}
    >
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card/50">
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">AI Trading Copilot</span>
              </div>

              <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-8">
                  <TabsTrigger value="general" className="text-xs px-3 h-7">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="earnings" className="text-xs px-3 h-7">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Earnings
                  </TabsTrigger>
                  <TabsTrigger value="news" className="text-xs px-3 h-7">
                    <Globe className="h-3.5 w-3.5 mr-1" />
                    News
                  </TabsTrigger>
                  <TabsTrigger value="social" className="text-xs px-3 h-7">
                    <Twitter className="h-3.5 w-3.5 mr-1" />
                    Social
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Clock className="h-3.5 w-3.5" />
                <span>Market: Open</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFullscreenMode(!fullscreenMode)}
                    >
                      {fullscreenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{fullscreenMode ? "Exit fullscreen" : "Fullscreen mode"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{sidebarOpen ? "Hide sidebar" : "Show sidebar"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

         
          {/* Market Overview Bar - LED Ticker */}
          <div className="border-t bg-black overflow-hidden h-8">
            <EnhancedTicker items={MARKET_INDICES} />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className={message.role === "user" ? "bg-primary h-7 w-7" : "bg-blue-600 h-7 w-7"}>
                    <AvatarFallback>{message.role === "user" ? "U" : message.thinking ? "..." : "AI"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.thinking
                            ? "bg-muted"
                            : "bg-card border shadow-sm"
                      }`}
                    >
                      {message.thinking ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                              ●
                            </span>
                            <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                              ●
                            </span>
                          </div>
                          <span>{message.content}</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-line">{message.content}</div>
                      )}
                    </div>

                    {/* Chart if available */}
                    {message.chart && renderChart(message.chart)}

                    {/* Citations */}
                    {message.citations && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Sources:</p>
                        {message.citations.map((citation, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs">
                            <Badge variant="outline" className="text-xs py-0">
                              {index + 1}
                            </Badge>
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {citation.text}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="text-muted-foreground">({citation.source})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Actions */}
                    {message.role === "assistant" && !message.thinking && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <BarChart2 className="h-3 w-3 mr-1" />
                          Create Strategy
                        </Button>
                      </div>
                    )}

                    <div className="mt-1 text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 py-3 border-t">
            <p className="text-xs font-medium mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-muted/50 border-muted-foreground/20"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-3 bg-card/50">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about market trends, stocks, or trading strategies..."
                className="pr-24 py-5 pl-10 bg-background shadow-sm"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {}}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload document</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isRecording ? "destructive" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleRecording}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRecording ? "Stop recording" : "Start voice input"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button size="sm" className="h-8" onClick={handleSendMessage} disabled={!input.trim() || isThinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Switch id="voice-mode" className="h-4 w-7" />
                <Label htmlFor="voice-mode" className="text-xs text-muted-foreground">
                  Voice Mode
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                AI Trading Copilot provides analysis based on available market data. Not financial advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l h-full bg-card/30"
          >
            <div className="h-full flex flex-col">
              <Tabs
                defaultValue="watchlist"
                value={sidebarTab}
                onValueChange={setSidebarTab}
                className="flex-1 flex flex-col"
              >
                <div className="border-b px-4 py-2 bg-muted/30">
                  <TabsList className="grid grid-cols-3 w-full h-8">
                    <TabsTrigger value="watchlist" className="text-xs h-7">
                      <BarChart2 className="h-3.5 w-3.5 mr-1" />
                      Watchlist
                    </TabsTrigger>
                    <TabsTrigger value="news" className="text-xs h-7">
                      <Globe className="h-3.5 w-3.5 mr-1" />
                      News
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="text-xs h-7">
                      <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                      Saved
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <TabsContent value="watchlist" className="m-0 p-4 h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <BarChart2 className="h-4 w-4 text-primary" />
                        Your Watchlist
                      </h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Market summary */}
                    <Card className="mb-4 bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">S&P 500</div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">4,587.64</span>
                              <span className="text-xs text-green-500">+0.5%</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">VIX</div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">18.24</span>
                              <span className="text-xs text-red-500">-2.1%</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">10Y Yield</div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">4.32%</span>
                              <span className="text-xs text-green-500">+0.03</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">USD Index</div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">104.28</span>
                              <span className="text-xs text-red-500">-0.2%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {WATCHLIST_ITEMS.map((item) => (
                        <Card
                          key={item.symbol}
                          className="overflow-hidden border-muted bg-card hover:bg-muted/30 transition-colors"
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1">
                                  <div className="font-medium">{item.symbol}</div>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                    {item.marketCap}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">{item.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium">${item.price.toFixed(2)}</div>
                                <div
                                  className={`text-xs ${
                                    item.change >= 0 ? "text-green-500" : "text-red-500"
                                  } flex items-center justify-end`}
                                >
                                  {item.change >= 0 ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {item.change >= 0 ? "+" : ""}
                                  {item.changePercent.toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-10">
                                {renderSparkline(
                                  item.sparkline,
                                  item.change >= 0 ? "var(--green-500)" : "var(--red-500)",
                                  20,
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-right">
                                <div className="text-xs text-muted-foreground">Vol</div>
                                <div className="text-xs font-mono">{item.volume}</div>
                                <div className="text-xs text-muted-foreground">P/E</div>
                                <div className="text-xs font-mono">{item.pe}</div>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-between">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => handleSuggestedPrompt(`Analyze ${item.symbol} recent performance`)}
                              >
                                <Search className="h-3 w-3 mr-1" />
                                Analyze
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => handleSuggestedPrompt(`Compare ${item.symbol} with competitors`)}
                              >
                                <BarChart2 className="h-3 w-3 mr-1" />
                                Compare
                              </Button>

                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                                <Info className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="news" className="m-0 p-4 h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <Globe className="h-4 w-4 text-primary" />
                        Market News
                      </h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {NEWS_ITEMS.map((item) => (
                        <Card key={item.id} className="overflow-hidden border-muted">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 h-4 shrink-0 ${
                                  item.sentiment === "positive"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : item.sentiment === "negative"
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                }`}
                              >
                                {item.sentiment}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <span>{item.source}</span>
                              <span className="mx-1">•</span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {item.time}
                              </span>
                              <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 h-4 font-normal">
                                {item.impact} impact
                              </Badge>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => handleSuggestedPrompt(`Analyze impact of: ${item.title}`)}
                              >
                                <Search className="h-3 w-3 mr-1" />
                                Analyze
                              </Button>

                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Read More
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="saved" className="m-0 p-4 h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <BookmarkPlus className="h-4 w-4 text-primary" />
                        Saved Prompts
                      </h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {SAVED_PROMPTS.map((prompt) => (
                        <Card
                          key={prompt.id}
                          className="overflow-hidden border-muted hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleSuggestedPrompt(prompt.text)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-3 w-3 text-primary" />
                              </div>
                              <p className="text-sm">{prompt.text}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Analyses</h4>

                      <Card className="overflow-hidden border-muted hover:bg-muted/30 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <PieChart className="h-3 w-3 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm">AAPL Earnings Analysis</p>
                              <p className="text-xs text-muted-foreground">Saved 2 hours ago</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-muted hover:bg-muted/30 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Layers className="h-3 w-3 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm">Sector Rotation Strategy</p>
                              <p className="text-xs text-muted-foreground">Saved yesterday</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </ScrollArea>

                {/* Pro Features Teaser */}
                <div className="border-t p-4 bg-muted/30">
                  <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <h4 className="font-medium text-sm">Upgrade to Pro</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get advanced market insights, real-time alerts, and unlimited analysis.
                      </p>
                      <Button size="sm" className="w-full mt-1 bg-blue-600 hover:bg-blue-700">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
