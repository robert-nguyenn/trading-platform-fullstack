// src/components/strategy/blocks/ActionBlockComponent.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
// Import specific types and enums
import {
    UpdateBlockDto,
    ActionBlockParameters,
    ActionType,
    OrderType,
    StrategyBlockWithChildren,
    StrategyBlockType,
    BuySellActionParams,
    NotifyActionParams,
    LogMessageActionParams,
    RebalanceActionParams,
    // StrategyBlockRendererComponent,
} from '@/lib/types';
// UI Components
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Added
import { Trash2, Edit, Save, X, TerminalSquare, Check, ChevronsUpDown } from 'lucide-react'; // Added Check, ChevronsUpDown
import { cn } from '@/lib/utils'; // Added cn

// Import Asset Data
import { fetchAssets, findAssetBySymbol, getAssetLabel, DetailedAsset } from '@/lib/assetData'; // Updated import
import { Action } from 'sonner';

interface ActionBlockProps extends StrategyBlockRendererProps {
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.ACTION }>;
}

export const ActionBlockComponent: React.FC<ActionBlockProps> = ({
    block,
    strategyId,
    onUpdateBlock,
    onDeleteBlock,
}) => {
    const [availableAssets, setAvailableAssets] = useState<DetailedAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    // Load available assets on component mount
    useEffect(() => {
        const loadAssets = async () => {
            setLoadingAssets(true);
            try {
                const assets = await fetchAssets();
                setAvailableAssets(assets);
            } catch (error) {
                console.error('Failed to load assets:', error);
            } finally {
                setLoadingAssets(false);
            }
        };
        loadAssets();
    }, []);

    const isInitiallyUnconfigured = useMemo(() => {
        const p = block.parameters;
        switch (p.actionType) {
            case ActionType.BUY:
            case ActionType.SELL:
                return !p.symbol || p.symbol.trim().length === 0;
            case ActionType.NOTIFY:
                return !p.message;
            case ActionType.LOG_MESSAGE:
                return !p.message || p.message.trim().length === 0;
            case ActionType.REBALANCE:
                return p.scope === 'Group' && !p.targetGroupId;
            default:
                return false;
        }
    }, [block.parameters])
    const [isEditing, setIsEditing] = useState(isInitiallyUnconfigured);
    const [params, setParams] = useState<ActionBlockParameters>(block.parameters);
    useEffect(() => {
        if (!isInitiallyUnconfigured) {
            setParams(block.parameters);
        }
    }, [block.parameters, isInitiallyUnconfigured]);
    const [symbolPopoverOpen, setSymbolPopoverOpen] = useState(false); // State for Symbol popover

    // Update state - merging changes into the current parameter structure
    const handleParamChange = (updates: Partial<ActionBlockParameters>) => { // Type hint for clarity
        // Type guard to ensure we only apply BuySell specific updates to BuySell params
        if (params.actionType === ActionType.BUY || params.actionType === ActionType.SELL) {
            setParams(prev => ({ ...prev, ...updates } as ActionBlockParameters));
        } else {
             // If it's not Buy/Sell, only update common props like 'name'
             if ('name' in updates) {
                setParams(prev => ({ ...prev, name: updates.name } as ActionBlockParameters));
            }
        }
    };

    // Special handler for changing the core ActionType (remains the same)
    const handleActionTypeChange = (newActionType: ActionType) => {
       let defaultParamsForType: ActionBlockParameters;
       switch (newActionType) {
            case ActionType.BUY:
            case ActionType.SELL:
               defaultParamsForType = { actionType: newActionType, symbol: '', orderType: OrderType.MARKET }; break; // Reset symbol
            // ... other cases remain the same
            case ActionType.NOTIFY:
               defaultParamsForType = { actionType: newActionType, message: '', channel: 'Platform' }; break;
            case ActionType.LOG_MESSAGE:
                defaultParamsForType = { actionType: newActionType, message: '', level: 'Info' }; break;
            case ActionType.REBALANCE:
                defaultParamsForType = { actionType: newActionType, scope: 'Portfolio' }; break;
            default:
                console.error("Unknown action type selected:", newActionType);
                return;
       }
       setParams({ ...defaultParamsForType, name: params.name } as ActionBlockParameters); // Keep name if already set
   };


    const handleSave = async () => {
        // Validation (remains largely the same, symbol is now required string)
        let isValid = true;
        const currentParams = params;
        switch (currentParams.actionType) {
            case ActionType.BUY:
            case ActionType.SELL:
                // Symbol MUST be a non-empty string selected from the list
                if (!currentParams.symbol || typeof currentParams.symbol !== 'string' || currentParams.symbol.trim() === '') {
                    isValid = false;
                    console.error("Invalid or missing symbol.");
                }
                if (!currentParams.quantity) { // Simplified quantity check
                     isValid = false;
                     console.error("Quantity is required.");
                 }
                // Add validation for limit/stop prices if needed
                 if ((currentParams.orderType === OrderType.LIMIT || currentParams.orderType === OrderType.STOP_LIMIT) && (currentParams.limitPrice === undefined || currentParams.limitPrice === null)) {
                    isValid = false;
                    console.error("Limit Price is required for Limit/Stop-Limit orders.");
                 }
                 if ((currentParams.orderType === OrderType.STOP || currentParams.orderType === OrderType.STOP_LIMIT) && (currentParams.stopPrice === undefined || currentParams.stopPrice === null)) {
                    isValid = false;
                    console.error("Stop Price is required for Stop/Stop-Limit orders.");
                 }
                break;
            // ... other validation cases remain the same
             case ActionType.NOTIFY:
             case ActionType.LOG_MESSAGE:
                 if (!currentParams.message) isValid = false;
                 break;
             case ActionType.REBALANCE:
                  if (currentParams.scope === 'Group' && !currentParams.targetGroupId) isValid = false;
                  break;
        }

        if (!isValid) {
            console.error("Action parameters invalid:", currentParams);
             // TODO: Show detailed validation errors to user (e.g., using toast)
             return;
        }

        const updateData: UpdateBlockDto = { parameters: params };

        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update action block:", error);
            // Add user feedback
        }
    };

    const handleCancel = () => {
        // Reset state from original block props
        setParams(block.parameters);
        setSymbolPopoverOpen(false); // Ensure popover closes on cancel
        setIsEditing(false);
    };

    // --- Render Parameter Inputs based on Action Type ---
    const renderParameterInputs = () => {
        if (!isEditing) return null;

        // Base input for optional name (remains the same)
        const nameInput = (
             <div className="space-y-1">
                 <Label htmlFor={`action-name-${block.id}`} className='text-xs'>Name (Optional)</Label>
                 <Input id={`action-name-${block.id}`} placeholder="e.g., Buy Apple Stock" value={params.name || ''} onChange={(e) => handleParamChange({ name: e.target.value })} className="h-8"/>
             </div>
        );

        switch (params.actionType) {
            case ActionType.BUY:
            case ActionType.SELL:
                 // Use type assertion for easier access within this block
                 const buySellParams = params as BuySellActionParams;
                 const selectedAsset = availableAssets.find(asset => asset.symbol === buySellParams.symbol);

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {nameInput}
                         {/* --- Symbol Selector --- */}
                         <div className="space-y-1">
                             <Label htmlFor={`action-symbol-btn-${block.id}`} className='text-xs'>Symbol*</Label>
                             <Popover open={symbolPopoverOpen} onOpenChange={setSymbolPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id={`action-symbol-btn-${block.id}`}
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={symbolPopoverOpen}
                                        className="w-full justify-between h-8 text-xs font-normal" // Adjusted style
                                    >
                                         <span className="truncate">
                                             {selectedAsset
                                                 ? `${selectedAsset.symbol} - ${selectedAsset.name}`
                                                 : "Select symbol..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search symbol or name..." className="h-9 text-xs" />
                                        <CommandList>
                                            <CommandEmpty>
                                                {loadingAssets ? "Loading assets..." : "No symbol found."}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {availableAssets.map((asset) => (
                                                    <CommandItem
                                                        key={asset.symbol}
                                                        value={`${asset.symbol} ${asset.name}`} // Search against symbol and name
                                                        onSelect={() => {
                                                            handleParamChange({ symbol: asset.symbol });
                                                            setSymbolPopoverOpen(false);
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                buySellParams.symbol === asset.symbol ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                         <span className='font-medium mr-2'>{asset.symbol}</span>
                                                         <span className='text-muted-foreground'>{asset.name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                         {/* --- Other Buy/Sell Parameters (remain the same) --- */}
                         <div className="space-y-1">
                             <Label htmlFor={`action-ordertype-${block.id}`} className='text-xs'>Order Type</Label>
                             <Select value={buySellParams.orderType || OrderType.MARKET} onValueChange={(v) => handleParamChange({ orderType: v as OrderType })}>
                                <SelectTrigger id={`action-ordertype-${block.id}`} className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.values(OrderType).map(i=><SelectItem key={i} value={i} className='text-xs'>{i}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         {(buySellParams.orderType === OrderType.LIMIT || buySellParams.orderType === OrderType.STOP_LIMIT) && (
                            <div className="space-y-1">
                                <Label htmlFor={`action-limit-${block.id}`} className='text-xs'>Limit Price*</Label>
                                <Input id={`action-limit-${block.id}`} required type="number" step="any" placeholder="Price" value={buySellParams.limitPrice ?? ''} onChange={(e) => handleParamChange({ limitPrice: parseFloat(e.target.value) || undefined })} className="h-8"/>
                            </div>
                         )}
                         {(buySellParams.orderType === OrderType.STOP || buySellParams.orderType === OrderType.STOP_LIMIT) && (
                            <div className="space-y-1">
                                <Label htmlFor={`action-stop-${block.id}`} className='text-xs'>Stop Price*</Label>
                                <Input id={`action-stop-${block.id}`} required type="number" step="any" placeholder="Price" value={buySellParams.stopPrice ?? ''} onChange={(e) => handleParamChange({ stopPrice: parseFloat(e.target.value) || undefined })} className="h-8"/>
                            </div>
                         )}
                         <div className="space-y-1">
                             <Label htmlFor={`action-qty-${block.id}`} className='text-xs'>Quantity*</Label>
                             <Input id={`action-qty-${block.id}`} required type="number" step="any" placeholder="Units/Shares" value={buySellParams.quantity ?? ''} onChange={(e) => handleParamChange({ quantity: parseFloat(e.target.value) || undefined })} className="h-8"/>
                         </div>
                         {/* TODO: Add TimeInForce, Trailing Stop etc. if needed */}
                    </div>
                );
            // ... other cases (NOTIFY, LOG_MESSAGE, REBALANCE) remain the same
            case ActionType.NOTIFY:
                 // Type assertion for clarity
                 const notifyParams = params as NotifyActionParams;
                 return (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                         {nameInput}
                         <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor={`action-msg-${block.id}`} className='text-xs'>Message*</Label>
                            <Textarea id={`action-msg-${block.id}`} required placeholder="Enter message content..." value={notifyParams.message || ''} onChange={(e) => handleParamChange({ message: e.target.value })} className="text-sm" rows={3}/>
                            <p className='text-xs text-muted-foreground'>You can use variables like {'{{symbol}}'}, {'{{price}}'}, etc.</p>
                         </div>
                          <>
                             <div className="space-y-1">
                                  <Label htmlFor={`action-channel-${block.id}`} className='text-xs'>Channel</Label>
                                 <Select value={notifyParams.channel || 'Platform'} onValueChange={(v) => handleParamChange({ channel: v as any })}>
                                    <SelectTrigger id={`action-channel-${block.id}`} className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['Platform', 'Email', 'Webhook', 'SMS'].map(i=><SelectItem key={i} value={i} className='text-xs'>{i}</SelectItem>)}</SelectContent>
                                </Select>
                             </div>
                              <div className="space-y-1">
                                 <Label htmlFor={`action-recip-${block.id}`} className='text-xs'>Recipient</Label>
                                 <Input id={`action-recip-${block.id}`} placeholder="Email, Webhook URL..." value={notifyParams.recipient || ''} onChange={(e) => handleParamChange({ recipient: e.target.value })} className="h-8"/>
                             </div>
                          </>
                     </div>
                 );
             case ActionType.LOG_MESSAGE:
                  // Type assertion for clarity
                 const logParams = params as LogMessageActionParams;
                 return (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                         {nameInput}
                         <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor={`action-msg-${block.id}`} className='text-xs'>Message*</Label>
                            <Textarea id={`action-msg-${block.id}`} required placeholder="Enter message content..." value={logParams.message || ''} onChange={(e) => handleParamChange({ message: e.target.value })} className="text-sm" rows={3}/>
                            <p className='text-xs text-muted-foreground'>You can use variables like {'{{symbol}}'}, {'{{price}}'}, etc.</p>
                         </div>
                           <div className="space-y-1">
                                <Label htmlFor={`action-level-${block.id}`} className='text-xs'>Log Level</Label>
                                 <Select value={logParams.level || 'Info'} onValueChange={(v) => handleParamChange({ level: v as any })}>
                                    <SelectTrigger id={`action-level-${block.id}`} className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['Info', 'Warning', 'Error', 'Debug'].map(i=><SelectItem key={i} value={i} className='text-xs'>{i}</SelectItem>)}</SelectContent>
                                </Select>
                           </div>
                     </div>
                 );
             case ActionType.REBALANCE:
                 // Type assertion for clarity
                 const rebalanceParams = params as RebalanceActionParams;
                 return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                          {nameInput}
                           <div className="space-y-1">
                                <Label htmlFor={`action-scope-${block.id}`} className='text-xs'>Scope</Label>
                                <Select value={rebalanceParams.scope || 'Portfolio'} onValueChange={(v) => handleParamChange({ scope: v as any })}>
                                    <SelectTrigger id={`action-scope-${block.id}`} className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['Portfolio', 'Group'].map(i=><SelectItem key={i} value={i} className='text-xs'>{i}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                           {rebalanceParams.scope === 'Group' && (
                               <div className="space-y-1">
                                   <Label htmlFor={`action-groupid-${block.id}`} className='text-xs'>Target Group ID*</Label>
                                   {/* TODO: Needs a better way to select a Group block */}
                                   <Input id={`action-groupid-${block.id}`} required placeholder="Enter Group Block ID" value={rebalanceParams.targetGroupId || ''} onChange={(e) => handleParamChange({ targetGroupId: e.target.value })} className="h-8"/>
                               </div>
                           )}
                           <div className="space-y-1">
                               <Label htmlFor={`action-deviation-${block.id}`} className='text-xs'>Allow Deviation (%)</Label>
                               <Input id={`action-deviation-${block.id}`} type="number" step="0.1" placeholder="Optional %" value={rebalanceParams.allowDeviation ?? ''} onChange={(e) => handleParamChange({ allowDeviation: parseFloat(e.target.value) || undefined })} className="h-8"/>
                           </div>
                           {/* TODO: Input for excludeSymbols (maybe multi-select or tags input) */}
                      </div>
                 );

            default:
                 const _exhaustiveCheck: never = params;
                 return <p className="text-xs text-muted-foreground italic">Unknown action type selected.</p>;
        }
    };

    // --- Render Action Summary (remains the same) ---
    const renderActionSummary = useMemo(() => {
         const p = block.parameters;
         let summary = p.name ? `${p.name}: ` : '';
         let symbolDisplay = (p.actionType === ActionType.BUY || p.actionType === ActionType.SELL) ? (p.symbol || '?') : '';

        switch (p.actionType) {
            case ActionType.BUY: summary += `Buy ${p.quantity ? `${p.quantity} units` : '?'} of ${symbolDisplay}`; break;
            case ActionType.SELL: summary += `Sell ${p.quantity ? `${p.quantity} units` : '?'} of ${symbolDisplay}`; break;
            case ActionType.NOTIFY: summary += `Notify: ${p.message?.substring(0, 30) || ''}...`; break;
            case ActionType.LOG_MESSAGE: summary += `Log (${p.level || 'Info'}): ${p.message?.substring(0, 30) || ''}...`; break;
            case ActionType.REBALANCE: summary += `Rebalance ${p.scope || 'Portfolio'}${p.scope === 'Group' ? ` (${p.targetGroupId || '?'})` : ''}`; break;
            default: summary += 'Unknown Action';
        }
        return <span className="text-sm font-mono text-indigo-900 truncate" title={summary}>{summary}</span>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [block.parameters]);


    return (
         <Card className="w-full border-indigo-300 bg-indigo-50/70 dark:border-indigo-700/80 dark:bg-indigo-950/50 shadow-sm dark:shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm min-h-[40px] dark:bg-indigo-950/40"> {/* Added min-height */}
                 <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
                     <Badge variant="outline" className="border-indigo-600 text-indigo-700 bg-white dark:border-indigo-400/80 dark:text-indigo-200 dark:bg-indigo-900/60 px-1.5 py-0.5 flex-shrink-0">
                         <TerminalSquare className="h-3 w-3 mr-1" /> Action
                    </Badge>
                    {!isEditing ? (
                         renderActionSummary
                    ) : (
                         // Select Action Type (remains the same)
                         <Select value={params.actionType} onValueChange={(v) => handleActionTypeChange(v as ActionType)}>
                            <SelectTrigger className="h-7 px-2 text-sm w-[150px] flex-shrink-0"> {/* Added flex-shrink-0 */}
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ActionType).map((type) => (
                                    <SelectItem key={type} value={type} className='text-xs'>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                     {/* Add a flexible spacer if needed when editing */}
                     {isEditing && <div className="flex-grow min-w-[10px]"></div>}
                </div>
                 {/* Action Buttons (remain the same) */}
                 <div className="flex items-center gap-0.5 flex-shrink-0">
                     {!isEditing ? (
                            // Show Edit button when not editing
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground dark:text-indigo-300 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/40" onClick={() => setIsEditing(true)} title="Edit Action"> <Edit className="h-3.5 w-3.5" /> </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 dark:text-indigo-300 hover:bg-blue-100 dark:hover:bg-indigo-900/60" onClick={handleSave} title="Save Action"> <Save className="h-3.5 w-3.5" /> </Button>
                                {/* --- MODIFICATION START --- */}
                                {!isInitiallyUnconfigured && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground dark:text-indigo-300 dark:hover:text-indigo-100 hover:bg-gray-100 dark:hover:bg-indigo-900/40" onClick={handleCancel} title="Cancel Edits"> <X className="h-4 w-4" /> </Button>
                                )}
                            </>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => onDeleteBlock(block.id)} title="Delete Action"> <Trash2 className="h-3.5 w-3.5" /> </Button>
                </div>
            </CardHeader>

             {/* Parameter editing form */}
             {isEditing && (
                 <CardContent className="px-3 py-3 border-t border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-indigo-950/30">
                    {renderParameterInputs()}
                </CardContent>
            )}
        </Card>
    );
};