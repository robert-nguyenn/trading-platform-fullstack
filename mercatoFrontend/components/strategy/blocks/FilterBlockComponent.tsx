// src/components/strategy/blocks/FilterBlockComponent.tsx
import React, { useState, useMemo } from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
// Import specific types
import { UpdateBlockDto, FilterBlockParameters, Operator, StrategyBlockWithChildren, StrategyBlockType } from '@/lib/types';
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Save, X, ListFilter } from 'lucide-react';

interface FilterBlockSpecificProps extends Omit<StrategyBlockRendererProps, 'block' | 'level'> {
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.FILTER }>;
     level: number;
    // StrategyBlockRendererComponent not typically needed
}

export const FilterBlockComponent: React.FC<FilterBlockSpecificProps> = ({
    block, // block.parameters is FilterBlockParameters
    strategyId,
    onUpdateBlock,
    onDeleteBlock,
}) => {
    const [isEditing, setIsEditing] = useState(false);

    // State for editable parameters
    const [filterParams, setFilterParams] = useState<FilterBlockParameters>(block.parameters);

    const handleParamChange = (field: keyof FilterBlockParameters, value: any) => {
        let processedValue = value;
        // Try to parse value as number if it looks like one, otherwise keep string
        if (field === 'value') {
             const num = parseFloat(value);
             processedValue = isNaN(num) || String(num) !== value ? value : num;
        }
        setFilterParams(prev => ({ ...prev, [field]: processedValue }));
    };

    const handleSave = async () => {
        if (!filterParams.metric || !filterParams.operator || filterParams.value === undefined || filterParams.value === '') {
             console.error("Metric, Operator, and Value are required for Filter.");
             // TODO: Show validation error
             return;
         }
        // Construct parameters matching FilterBlockParameters
        const updatedParams: FilterBlockParameters = { ...filterParams };
        const updateData: UpdateBlockDto = { parameters: updatedParams };

        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update filter block:", error);
             // Add user feedback
        }
    };

    const handleCancel = () => {
        setFilterParams(block.parameters);
        setIsEditing(false);
    };

    // Memoized display string
    const displayFilter = useMemo(() => {
        const p = block.parameters;
        return `${p.name ? `${p.name}: ` : ''}Filter where ${p.metric || '?'} ${p.operator || '?'} ${p.value ?? '?'}`;
    }, [block.parameters]);


    return (
         <Card className="w-full border-teal-300 bg-teal-50/70 dark:border-teal-600 dark:bg-teal-950/30 shadow-sm hover:shadow-md transition-shadow duration-150">
            <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm">
                 <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
                     <Badge variant="outline" className="border-teal-600 text-teal-700 bg-white dark:border-teal-400 dark:text-teal-300 dark:bg-teal-950/50 px-1.5 py-0.5 flex-shrink-0">
                         <ListFilter className="h-3 w-3 mr-1" /> Filter
                    </Badge>
                    {!isEditing ? (
                        <span className="text-sm font-mono text-teal-900 dark:text-teal-100 truncate" title={displayFilter}>
                            {displayFilter}
                        </span>
                    ) : (
                         // --- Editing Form ---
                         <div className="flex items-end gap-2 flex-grow flex-wrap">
                             <div className="space-y-1 flex-grow min-w-[120px]">
                                 <Label htmlFor={`filt-metric-${block.id}`} className='text-xs'>Metric*</Label>
                                 {/* TODO: Use Select with predefined metrics */}
                                 <Input id={`filt-metric-${block.id}`} placeholder="e.g., MarketCap" value={filterParams.metric} onChange={(e) => handleParamChange('metric', e.target.value)} className="h-8" required />
                             </div>
                             <div className="space-y-1 w-[150px]">
                                  <Label htmlFor={`filt-op-${block.id}`} className='text-xs'>Operator*</Label>
                                 <Select value={filterParams.operator} onValueChange={(v) => handleParamChange('operator', v as Operator)} required>
                                     <SelectTrigger id={`filt-op-${block.id}`} className="h-8"><SelectValue placeholder="Select Op" /></SelectTrigger>
                                     <SelectContent>{Object.values(Operator).map(op=><SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                                 </Select>
                             </div>
                              <div className="space-y-1 flex-grow min-w-[80px]">
                                  <Label htmlFor={`filt-val-${block.id}`} className='text-xs'>Value*</Label>
                                 <Input id={`filt-val-${block.id}`} placeholder="Value" value={String(filterParams.value ?? '')} onChange={(e) => handleParamChange('value', e.target.value)} className="h-8" required />
                             </div>
                             {/* Optional: Input for Name, DataSource */}
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
    );
};