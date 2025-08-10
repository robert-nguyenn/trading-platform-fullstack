// src/components/strategy/blocks/WeightBlockComponent.tsx
import React, { useState } from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
// Import specific types
import { UpdateBlockDto, WeightBlockParameters, StrategyBlockType, StrategyBlockWithChildren } from '@/lib/types';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Edit, Save, X, Percent, Zap } from 'lucide-react';
import { AddBlockButton } from './AddBlockButton';

interface WeightBlockSpecificProps extends Omit<StrategyBlockRendererProps, 'block' | 'level'> {
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.WEIGHT }>;
    StrategyBlockRendererComponent: React.FC<StrategyBlockRendererProps>;
     level: number;
}

export const WeightBlockComponent: React.FC<WeightBlockSpecificProps> = ({
    block, // block.parameters is WeightBlockParameters
    strategyId,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    level,
    StrategyBlockRendererComponent // Use this for children
}) => {
    const [isEditing, setIsEditing] = useState(false);
    // Use string state for input, number for actual value
    const [percentageStr, setPercentageStr] = useState<string>(String(block.parameters.percentage));
    const [leverageStr, setLeverageStr] = useState<string>(String(block.parameters.leverage || '1')); // Default leverage to '1'

    const handleSave = async () => {
        const numericPercentage = parseFloat(percentageStr);
        const numericLeverage = parseFloat(leverageStr) || 1; // Default to 1 if empty/invalid

        if (isNaN(numericPercentage) || numericPercentage < 0) {
            console.error("Invalid percentage value");
            // TODO: Show validation error
            return;
        }
        if (isNaN(numericLeverage) || numericLeverage <= 0) {
            console.error("Invalid leverage value, must be positive.");
             // TODO: Show validation error
            return;
        }

        // Construct parameters matching WeightBlockParameters
        const updatedParams: WeightBlockParameters = {
            percentage: numericPercentage,
            leverage: numericLeverage === 1 ? undefined : numericLeverage, // Store undefined if leverage is 1
        };
        const updateData: UpdateBlockDto = { parameters: updatedParams };

        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update weight block:", error);
            // Add user feedback
        }
    };

    const handleCancel = () => {
        setPercentageStr(String(block.parameters.percentage));
        setLeverageStr(String(block.parameters.leverage || '1'));
        setIsEditing(false);
    };

    const displayPercentage = block.parameters.percentage;
    const displayLeverage = block.parameters.leverage; // Will be number or undefined

    return (
        <div className="weight-block-wrapper">
            <Card className="w-full border-purple-300 bg-purple-50/70 dark:border-purple-600 dark:bg-purple-950/30 shadow-sm mb-0 z-10 relative">
                <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm">
                    <div className="flex items-center gap-2 flex-grow mr-2">
                        <Badge variant="outline" className="border-purple-600 text-purple-700 bg-white dark:border-purple-400 dark:text-purple-300 dark:bg-purple-950/50 px-1.5 py-0.5 flex-shrink-0">
                            <Percent className="h-3 w-3 mr-1" /> Weight
                        </Badge>
                        {!isEditing ? (
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{displayPercentage}%</span>
                                {displayLeverage && displayLeverage !== 1 && (
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="secondary" className="px-1 py-0 text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300">
                                                    <Zap className="h-2.5 w-2.5 mr-0.5"/> {displayLeverage}x Lev
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Leverage Applied: {displayLeverage}x</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        ) : (
                            // -- Editing Form --
                            <div className="flex items-center gap-3">
                                <div className='flex items-center gap-1'>
                                     <Label htmlFor={`weight-perc-${block.id}`} className='text-xs sr-only'>Percentage</Label>
                                     <Input
                                         id={`weight-perc-${block.id}`}
                                         type="number"
                                         value={percentageStr}
                                         onChange={(e) => setPercentageStr(e.target.value)}
                                         className="h-7 px-2 text-sm w-20"
                                         autoFocus
                                         step="0.1"
                                         min="0"
                                     />
                                     <span className='text-sm font-medium'>%</span>
                                </div>
                                 <div className='flex items-center gap-1'>
                                      <Label htmlFor={`weight-lev-${block.id}`} className='text-xs text-muted-foreground'>Leverage</Label>
                                      <Input
                                          id={`weight-lev-${block.id}`}
                                          type="number"
                                          value={leverageStr}
                                          onChange={(e) => setLeverageStr(e.target.value)}
                                          className="h-7 px-2 text-sm w-16"
                                          step="0.1"
                                          min="0.1" // Leverage typically > 0
                                          placeholder='1'
                                      />
                                      <span className='text-sm font-medium'>x</span>
                                 </div>
                            </div>
                        )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                         {/* ... Edit/Save/Cancel/Delete buttons ... */}
                           {!isEditing ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:hover:text-foreground" onClick={() => setIsEditing(true)}> <Edit className="h-3.5 w-3.5" /> </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" onClick={handleSave}> <Save className="h-3.5 w-3.5" /> </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleCancel}> <X className="h-4 w-4" /> </Button>
                            </>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => onDeleteBlock(block.id)}> <Trash2 className="h-3.5 w-3.5" /> </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Render Children Nested Under the Weight */}
            {/* Indentation/border applied by the div, level passed down */}
            <div className="weight-children-container pt-1 border-l-2 border-purple-200 dark:border-purple-600 ml-2 pl-2">
                 {(block.children && block.children.length > 0) ? (
                    block.children.map(child => (
                        <StrategyBlockRendererComponent
                            key={child.id}
                            block={child}
                            strategyId={strategyId}
                            onAddBlock={onAddBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDeleteBlock={onDeleteBlock}
                            level={level + 1} // Children are one level deeper logically
                            StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                        />
                    ))
                ) : (
                     <div className="py-2 px-2 text-xs text-muted-foreground italic">
                         Weight block needs a child (e.g., Asset, Group) to apply allocation to.
                         {/* Optionally add a dedicated "Add Asset/Group" button here */}
                         <AddBlockButton parentId={block.id} onAddBlock={onAddBlock} buttonLabel='Add Asset/Group' buttonSize='sm' />
                     </div>
                )}
            </div>
        </div>
    );
};