// src/components/strategy/blocks/AssetBlockComponent.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react'; // Added useCallback
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
import { StrategyBlockType, StrategyBlockWithChildren, UpdateBlockDto, AssetBlockParameters, AssetClass } from '@/lib/types';
import { MOCK_DETAILED_ASSETS, findAssetBySymbol, DetailedAsset, getAssetLabel } from '@/lib/assetData'; // Import mock data and helper
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Remove unused Input import if only using Combobox
// import { Input } from "@/components/ui/input";
// Remove unused Select imports if only using Combobox
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Import Command components
import { Trash2, Edit, Save, X, DollarSign, Check, ChevronsUpDown } from 'lucide-react'; // Import Check, ChevronsUpDown
import { cn } from '@/lib/utils'; // Ensure cn is imported

interface AssetBlockSpecificProps extends Omit<StrategyBlockRendererProps, 'block' | 'level'> {
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.ASSET }>;
    level: number;
}

export const AssetBlockComponent: React.FC<AssetBlockSpecificProps> = ({
    block,
    strategyId,
    onUpdateBlock,
    onDeleteBlock,
}) => {
    const isInitiallyUnconfigured = useMemo(() => {
        return !block.parameters.symbol || block.parameters.symbol.trim().length === 0;
    }, [block.parameters.symbol])
    const [isEditing, setIsEditing] = useState(isInitiallyUnconfigured);

    useEffect(() => {
        if (!isInitiallyUnconfigured) {
            setSelectedSymbol(block.parameters.symbol);
            setAssetClass(block.parameters.assetClass);
            setExchange(block.parameters.exchange || null);
        }
    }, [block.id, block.parameters, isInitiallyUnconfigured])

    const [assetPopoverOpen, setAssetPopoverOpen] = useState(false); // State for the popover

    // State now holds the selected symbol (or null if none selected)
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(block.parameters.symbol);

    // These can be derived or potentially stored if needed for overrides
    const [assetClass, setAssetClass] = useState<AssetClass | undefined | null>(block.parameters.assetClass);
    const [exchange, setExchange] = useState<string | null>(block.parameters.exchange || null);

    // Find the full asset details based on the selected symbol
    const selectedAssetDetails = useMemo(() => findAssetBySymbol(selectedSymbol), [selectedSymbol]);

    // Update handler for when an asset is selected from the dropdown
    const handleAssetSelect = useCallback((symbol: string) => {
        const asset = findAssetBySymbol(symbol);
        setSelectedSymbol(symbol);
        if (asset) {
            // Automatically update class and exchange based on selected asset
            setAssetClass(asset.assetClass);
            setExchange(asset.exchange);
        } else {
            // Reset if symbol doesn't match known assets (optional)
            setAssetClass(null);
            setExchange(null);
        }
        setAssetPopoverOpen(false); // Close the popover
    }, []); // No dependencies needed if findAssetBySymbol is pure

    const handleSave = async () => {
        if (!selectedSymbol) {
            console.error("Asset Symbol cannot be empty");
            // TODO: Add user feedback (toast)
            return;
        }

        // Construct parameters using the selected symbol and derived/current class/exchange
        const updatedParams: AssetBlockParameters = {
            symbol: selectedSymbol,
            assetClass: assetClass || undefined, // Use derived/current state, fallback to undefined
            exchange: exchange || undefined,   // Use derived/current state, fallback to undefined
        };
        const updateData: UpdateBlockDto = { parameters: updatedParams };

        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update asset block:", error);
            // TODO: Add user feedback
        }
    };

    const handleCancel = () => {
        // Reset state from original block props
        setSelectedSymbol(block.parameters.symbol);
        setAssetClass(block.parameters.assetClass);
        setExchange(block.parameters.exchange || null);
        setIsEditing(false);
    };

    // Memoize display values, using selectedAssetDetails for name if available
    const displayInfo = useMemo(() => {
        const parts: string[] = [];
        const currentAssetClass = selectedAssetDetails?.assetClass ?? assetClass; // Prefer derived, fallback to stored
        const currentExchange = selectedAssetDetails?.exchange ?? exchange; // Prefer derived, fallback to stored

        if (currentAssetClass) parts.push(`(${currentAssetClass})`);
        if (currentExchange) parts.push(`on ${currentExchange}`);
        return parts.join(' ');
    }, [selectedAssetDetails, assetClass, exchange]);

    const displayName = selectedAssetDetails?.name ?? selectedSymbol; // Show name if found, else symbol

    return (
        <Card className="w-full border-green-300 bg-green-50/70 dark:border-green-700/80 dark:bg-green-950/50 shadow-sm hover:shadow-md dark:shadow-lg transition-shadow duration-150">
            <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm min-h-[40px] dark:bg-green-950/40">
                {/* Left Side: Badge and Display */}
                <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
                    <Badge variant="outline" className="border-green-600 text-green-700 bg-white dark:border-green-400/80 dark:text-green-200 dark:bg-green-900/60 px-1.5 py-0.5 flex-shrink-0">
                        <DollarSign className="h-3 w-3 mr-1" /> Asset
                    </Badge>

                    {!isEditing ? (
                        // Display Mode: Show selected symbol/name and derived info
                        <div className="flex items-baseline gap-1.5 overflow-hidden">
                            <span className="font-medium text-gray-800 dark:text-green-200 truncate" title={displayName ?? undefined}>
                                {displayName || "No Asset Selected"}
                            </span>
                            {displayInfo && <span className="text-xs text-muted-foreground dark:text-green-300/70 truncate" title={displayInfo}>{displayInfo}</span>}
                        </div>
                    ) : (
                        // Edit Mode: Show Combobox for asset selection
                        <div className="flex-grow">
                             <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                                 <PopoverTrigger asChild>
                                     <Button
                                         variant="outline"
                                         role="combobox"
                                         aria-expanded={assetPopoverOpen}
                                         className="w-full sm:w-[250px] justify-between h-8 text-xs font-normal" // Adjust width
                                     >
                                         {selectedSymbol
                                             ? MOCK_DETAILED_ASSETS.find((asset) => asset.symbol === selectedSymbol)?.name // Show full name in trigger
                                             : "Select asset..."}
                                         <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                     </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                     <Command>
                                         <CommandInput placeholder="Search asset symbol or name..." className="h-9" />
                                         <CommandList>
                                             <CommandEmpty>No asset found.</CommandEmpty>
                                             <CommandGroup>
                                                 {MOCK_DETAILED_ASSETS.map((asset) => (
                                                     <CommandItem
                                                         key={asset.symbol}
                                                         value={`${asset.symbol} - ${asset.name}`} // Search by symbol and name
                                                         onSelect={() => handleAssetSelect(asset.symbol)}
                                                         className="text-xs"
                                                     >
                                                         <Check
                                                             className={cn(
                                                                 "mr-2 h-4 w-4",
                                                                 selectedSymbol === asset.symbol ? "opacity-100" : "opacity-0"
                                                             )}
                                                         />
                                                         <div className='flex flex-col'>
                                                            <span>{asset.symbol}</span>
                                                            <span className='text-muted-foreground text-xs'>{asset.name}</span>
                                                         </div>
                                                     </CommandItem>
                                                 ))}
                                             </CommandGroup>
                                         </CommandList>
                                     </Command>
                                 </PopoverContent>
                             </Popover>
                             {/* Removed AssetClass Select and Exchange Input */}
                        </div>
                    )}
                </div>

                {/* Right Side: Action Buttons */}
{/* Right Side: Action Buttons */}
<div className="flex items-center gap-0.5 flex-shrink-0">
    {!isEditing ? (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/40 hover:text-foreground" onClick={() => setIsEditing(true)}>
            <Edit className="h-3.5 w-3.5" />
        </Button>
    ) : (
        <>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 dark:text-green-300 hover:bg-blue-100 dark:hover:bg-green-900/60" onClick={handleSave} title="Save Asset">
                <Save className="h-3.5 w-3.5" />
            </Button>
            {!isInitiallyUnconfigured && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground dark:text-green-300 dark:hover:text-green-100 hover:bg-gray-100 dark:hover:bg-green-900/40" onClick={handleCancel} title="Cancel Edit">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </>
    )}
    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50" onClick={() => onDeleteBlock(block.id)} title="Delete Asset Block">
        <Trash2 className="h-3.5 w-3.5" />
    </Button>
</div>
            </CardHeader>
        </Card>
    );
};