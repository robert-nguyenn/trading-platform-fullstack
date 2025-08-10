// src/components/strategy/AddBlockButton.tsx
import React, { useState } from 'react';
import { Plus, AlertCircle, DollarSign, Percent, BarChart3, ListFilter, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    StrategyBlockType,
    CreateBlockDto,
    // Import specific param types and enums for defaults
    Operator,
    ActionType,
    ConditionIfBlockParameters,
    FilterBlockParameters,
    ActionBlockParameters,
    WeightBlockParameters,
    AssetBlockParameters,
    GroupBlockParameters,
    OrderType,
} from '@/lib/types';

// Define the props the component expects
interface AddBlockButtonProps {
    parentId: string | null; // ID of the block this button is inside (or null for root)
    onAddBlock: (parentId: string | null, blockData: CreateBlockDto) => Promise<void>; // Callback function
    buttonSize?: 'sm' | 'default' | 'lg' | 'icon'; // Optional size override
    buttonLabel?: string; // Optional label override
    // Optional context can be added here if needed later
    // context?: 'then' | 'else' | 'group-content' | etc.;
}

// Configuration for the block types shown in the popover
const blockTypesConfig = [
    { type: StrategyBlockType.CONDITION_IF, label: 'Condition (If/Then)', icon: AlertCircle, description: 'Execute blocks based on a condition' },
    { type: StrategyBlockType.ASSET, label: 'Asset / Instrument', icon: DollarSign, description: 'Add stocks, ETFs, crypto, etc.' },
    { type: StrategyBlockType.GROUP, label: 'Portfolio Group', icon: BarChart3, description: 'Group multiple assets/blocks' },
    { type: StrategyBlockType.WEIGHT, label: 'Weight / Exposure', icon: Percent, description: 'Allocate funds to the block(s) below' },
    { type: StrategyBlockType.FILTER, label: 'Metric Filter', icon: ListFilter, description: 'Filter assets based on metrics' },
    { type: StrategyBlockType.ACTION, label: 'Action', icon: TerminalSquare, description: 'Define a specific action (Buy, Sell, Notify)' },
];

/**
 * A button component that triggers a popover allowing users to select and add
 * a new strategy block as a child of the specified parentId.
 */
export const AddBlockButton: React.FC<AddBlockButtonProps> = ({
    // Destructure props for use within the component
    parentId,
    onAddBlock,
    buttonSize = 'sm', // Default size
    buttonLabel = 'Add Block' // Default label
}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);

    // Handler function called when a block type is selected from the popover
    const handleSelectBlockType = (blockType: StrategyBlockType) => {
        // Generate appropriate default parameters based on the selected block type
        let defaultParams: Record<string, any> = {};
        switch (blockType) {
            case StrategyBlockType.WEIGHT:
                defaultParams = { percentage: 100 } satisfies WeightBlockParameters;
                break;
            case StrategyBlockType.ASSET:
                defaultParams = { symbol: '' } satisfies Partial<AssetBlockParameters>;
                break;
            case StrategyBlockType.GROUP:
                defaultParams = { name: '' } satisfies GroupBlockParameters;
                break;
            case StrategyBlockType.CONDITION_IF:
                defaultParams = {
                    leftOperand: { kind: null }, // Start unconfigured
                    operator: Operator.GREATER_THAN, // Sensible default operator
                    rightOperand: { kind: null }, // Start unconfigured
                    // Add other necessary defaults here
                } satisfies ConditionIfBlockParameters;
                break;
            case StrategyBlockType.FILTER:
                defaultParams = {
                    metric: '', // Requires user input
                    operator: Operator.GREATER_THAN,
                    value: 0, // Default value
                } satisfies FilterBlockParameters;
                break;
            case StrategyBlockType.ACTION:
                 const defaultActionType = ActionType.BUY; // Default to BUY
                 defaultParams = {
                    actionType: defaultActionType,
                    symbol: '', // BUY needs a symbol
                    // percentage: 100, // Default amount
                    orderType: OrderType.MARKET, // Default order type
                 } satisfies ActionBlockParameters;
                 break;
             case StrategyBlockType.ROOT:
                console.error("Cannot add ROOT block manually via AddBlockButton.");
                return; // Prevent adding ROOT block
        }

        // Construct the data transfer object (DTO) for the new block
        const blockData: CreateBlockDto = {
            blockType: blockType,
            parameters: defaultParams, // Use generated defaults
            parentId: parentId, // Use the parentId passed via props
            order: 999, // Assign a temporary high order; backend should handle final ordering
        };

        // Call the callback function passed via props to add the block
        onAddBlock(parentId, blockData); // Use the onAddBlock passed via props
        setPopoverOpen(false); // Close the popover after selection
    };

    // Render the Popover component containing the trigger button and content
    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                {/* The button that opens the popover */}
                <Button variant="outline" size={buttonSize} className="gap-1 text-xs h-7">
                    <Plus className="h-3 w-3" />
                    {buttonLabel}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                {/* Content displayed inside the popover */}
                <div className="grid gap-4">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">Add Block</h4>
                        <p className="text-sm text-muted-foreground">Select a block type to add</p>
                    </div>
                    <div className="grid gap-1"> {/* Reduced gap between buttons */}
                        {/* Map over the block type configurations to create buttons */}
                        {blockTypesConfig.map(({ type, label, icon: Icon, description }) => (
                            <Button
                                key={type}
                                variant="ghost" // Use ghost style for list items
                                className="justify-start gap-3 h-auto py-2 px-2 text-left w-full" // Style for list appearance
                                onClick={() => handleSelectBlockType(type)} // Call handler on click
                            >
                                {/* Icon container */}
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground flex-shrink-0">
                                    <Icon className="h-4 w-4" />
                                </div>
                                {/* Text container */}
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-medium text-sm truncate">{label}</span>
                                    <span className="text-xs text-muted-foreground truncate">{description}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};