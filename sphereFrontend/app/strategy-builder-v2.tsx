"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { Plus, Save, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Custom Node Components
const RootNode = ({ data, isConnectable }: any) => (
  <div className="p-2 rounded-md border-2 border-primary bg-primary/10 w-60">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-primary">ROOT</Badge>
      <h3 className="font-medium">Strategy Root</h3>
    </div>
    <div className="text-xs text-muted-foreground">Starting point of your strategy</div>
    <div className="flex justify-end mt-2">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={data.onConfigure}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

const AssetNode = ({ data, isConnectable }: any) => (
  <div className="p-2 rounded-md border-2 border-green-500 bg-green-50 w-60">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-green-500">ASSET</Badge>
      <h3 className="font-medium">{data.symbol || "Select Asset"}</h3>
    </div>
    <div className="text-xs text-muted-foreground">
      {data.symbol ? `Trading ${data.symbol}` : "Configure this asset"}
    </div>
    <div className="flex justify-end mt-2">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={data.onConfigure}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

const ConditionNode = ({ data, isConnectable }: any) => (
  <div className="p-2 rounded-md border-2 border-blue-500 bg-blue-50 w-60">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-blue-500">CONDITION</Badge>
      <h3 className="font-medium">{data.indicatorType ? `${data.indicatorType} Condition` : "New Condition"}</h3>
    </div>
    {data.indicatorType ? (
      <div className="text-xs">
        <div>
          {data.symbol} {data.indicatorType}
          {data.period ? `(${data.period})` : ""} {data.operator} {data.targetValue}
        </div>
      </div>
    ) : (
      <div className="text-xs text-muted-foreground">Configure this condition</div>
    )}
    <div className="flex justify-end mt-2">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={data.onConfigure}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

const ActionNode = ({ data, isConnectable }: any) => (
  <div className="p-2 rounded-md border-2 border-red-500 bg-red-50 w-60">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-red-500">ACTION</Badge>
      <h3 className="font-medium">{data.actionType ? `${data.actionType} Action` : "New Action"}</h3>
    </div>
    {data.actionType ? (
      <div className="text-xs">
        {data.actionType} {data.quantity} {data.symbol}
      </div>
    ) : (
      <div className="text-xs text-muted-foreground">Configure this action</div>
    )}
    <div className="flex justify-end mt-2">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={data.onConfigure}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

// Node configuration modals
const AssetConfigModal = ({ node, onSave, open, onOpenChange }: any) => {
  const [symbol, setSymbol] = useState(node.data.symbol || "")

  const handleSave = () => {
    onSave({ ...node.data, symbol })
    onOpenChange(false)
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Configure Asset</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Asset Symbol</Label>
          <Input id="symbol" placeholder="e.g., AAPL, SPY" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <Button onClick={handleSave} className="w-full">
          Save Asset Configuration
        </Button>
      </div>
    </DialogContent>
  )
}

const ConditionConfigModal = ({ node, onSave, open, onOpenChange }: any) => {
  const [config, setConfig] = useState({
    indicatorType: node.data.indicatorType || "SMA",
    symbol: node.data.symbol || "",
    period: node.data.period || 50,
    operator: node.data.operator || "GREATER_THAN",
    targetValue: node.data.targetValue || 0,
  })

  const handleChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave({ ...node.data, ...config })
    onOpenChange(false)
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Configure Condition</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="indicatorType">Indicator Type</Label>
          <Select value={config.indicatorType} onValueChange={(value) => handleChange("indicatorType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select indicator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMA">Simple Moving Average (SMA)</SelectItem>
              <SelectItem value="EMA">Exponential Moving Average (EMA)</SelectItem>
              <SelectItem value="RSI">Relative Strength Index (RSI)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">Asset Symbol</Label>
          <Input
            id="symbol"
            placeholder="e.g., AAPL, SPY"
            value={config.symbol}
            onChange={(e) => handleChange("symbol", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Period</Label>
          <Input
            id="period"
            type="number"
            placeholder="e.g., 50, 200"
            value={config.period}
            onChange={(e) => handleChange("period", Number.parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator">Operator</Label>
          <Select value={config.operator} onValueChange={(value) => handleChange("operator", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EQUALS">Equals (=)</SelectItem>
              <SelectItem value="GREATER_THAN">Greater Than (&gt;)</SelectItem>
              <SelectItem value="LESS_THAN">Less Than (&lt;)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetValue">Target Value</Label>
          <Input
            id="targetValue"
            type="number"
            placeholder="e.g., 100"
            value={config.targetValue}
            onChange={(e) => handleChange("targetValue", Number.parseFloat(e.target.value))}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Condition Configuration
        </Button>
      </div>
    </DialogContent>
  )
}

const ActionConfigModal = ({ node, onSave, open, onOpenChange }: any) => {
  const [config, setConfig] = useState({
    actionType: node.data.actionType || "BUY",
    symbol: node.data.symbol || "",
    quantity: node.data.quantity || 1,
  })

  const handleChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave({ ...node.data, ...config })
    onOpenChange(false)
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Configure Action</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="actionType">Action Type</Label>
          <Select value={config.actionType} onValueChange={(value) => handleChange("actionType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">Asset Symbol</Label>
          <Input
            id="symbol"
            placeholder="e.g., AAPL, SPY"
            value={config.symbol}
            onChange={(e) => handleChange("symbol", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="e.g., 10"
            value={config.quantity}
            onChange={(e) => handleChange("quantity", Number.parseInt(e.target.value))}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Action Configuration
        </Button>
      </div>
    </DialogContent>
  )
}

export function StrategyBuilderV2() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "root",
      position: { x: 250, y: 50 },
      data: { label: "Root Node" },
    },
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"flow" | "timeline">("flow")
  const [reactFlowReady, setReactFlowReady] = useState(false)

  // Define node types
  const nodeTypes: NodeTypes = {
    root: RootNode,
    asset: AssetNode,
    condition: ConditionNode,
    action: ActionNode,
  }

  // Handle node configuration
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setConfigModalOpen(true)
  }

  // Update node data after configuration
  const handleNodeDataUpdate = (updatedData: any) => {
    if (!selectedNode) return

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData,
              onConfigure: () => handleNodeClick({} as React.MouseEvent, node),
            },
          }
        }
        return node
      }),
    )
  }

  // Handle connections between nodes
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // Add a new node
  const addNode = (type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        onConfigure: () => {},
      },
    }

    // Add onConfigure callback
    newNode.data.onConfigure = () => handleNodeClick({} as React.MouseEvent, newNode)

    setNodes((nds) => [...nds, newNode])
  }

  // Save the strategy
  const saveStrategy = () => {
    // Convert nodes and edges to backend format
    const strategyData = {
      name: "My Strategy",
      description: "A strategy created with the visual editor",
      blocks: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: { ...node.data },
        position: node.position,
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    }

    console.log("Saving strategy:", strategyData)
    // In a real app, you would send this to your API
    alert("Strategy saved successfully!")
  }

  useEffect(() => {
    // Small delay to ensure DOM is ready before initializing ReactFlow
    const timer = setTimeout(() => {
      setReactFlowReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "flow" | "timeline")} className="w-auto">
            <TabsList>
              <TabsTrigger value="flow">Flow View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={saveStrategy} className="gap-1">
          <Save className="h-4 w-4" />
          Save Strategy
        </Button>
      </div>

      <div className="h-[600px] border rounded-md bg-background relative">
        <ReactFlowProvider>
          <div ref={reactFlowWrapper} className="absolute inset-0">
            {reactFlowReady && (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              >
                <Controls />
                <MiniMap />
                <Background />
                <Panel position="top-right" className="bg-background p-2 rounded-md border shadow-sm">
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => addNode("asset")} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Asset
                    </Button>
                    <Button onClick={() => addNode("condition")} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Condition
                    </Button>
                    <Button onClick={() => addNode("action")} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Action
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </Panel>
              </ReactFlow>
            )}
          </div>
        </ReactFlowProvider>
      </div>

      {/* Configuration Modals */}
      <Dialog open={configModalOpen && selectedNode !== null} onOpenChange={setConfigModalOpen}>
        {selectedNode?.type === "asset" && (
          <AssetConfigModal
            node={selectedNode}
            onSave={handleNodeDataUpdate}
            open={configModalOpen}
            onOpenChange={setConfigModalOpen}
          />
        )}
        {selectedNode?.type === "condition" && (
          <ConditionConfigModal
            node={selectedNode}
            onSave={handleNodeDataUpdate}
            open={configModalOpen}
            onOpenChange={setConfigModalOpen}
          />
        )}
        {selectedNode?.type === "action" && (
          <ActionConfigModal
            node={selectedNode}
            onSave={handleNodeDataUpdate}
            open={configModalOpen}
            onOpenChange={setConfigModalOpen}
          />
        )}
      </Dialog>
    </div>
  )
}

