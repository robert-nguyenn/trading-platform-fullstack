// src/components/strategy/blocks/ConditionIfBlockComponent.tsx

import { INDICATOR_METADATA } from '@/lib/indicatorMetadata';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
import { OperandConfigurationPopover } from './OperandConfigurationPopover';

import {
    UpdateBlockDto,
    ConditionIfBlockParameters,
    Operator,
    StrategyBlockWithChildren,
    StrategyBlockType,
    ConditionOperand,
    OperandKind
} from '@/lib/types';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Save, X, AlertCircle, Check } from 'lucide-react';
import { AddBlockButton } from './AddBlockButton';
import { cn } from '@/lib/utils';

interface ConditionIfBlockSpecificProps extends Omit<StrategyBlockRendererProps, 'block' | 'level'> {
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.CONDITION_IF }>;
    StrategyBlockRendererComponent: React.FC<StrategyBlockRendererProps>;
    level: number;
}

const defaultOperand: ConditionOperand = { kind: null };

const formatOperandDisplay = (operand: ConditionOperand): string => {
    if (!operand || operand.kind === null) {
        return "Select Condition"; // Changed placeholder text slightly
    }
    switch (operand.kind) {
        case OperandKind.VALUE:
             const val = operand.value;
             return (val !== undefined && val !== null && val !== '') ? String(val) : 'Value?';
        case OperandKind.TECHNICAL_INDICATOR:
            // Ensure indicatorType exists before accessing metadata/parameters
            if (!operand.indicatorType) return 'Technical Indicator?';
            const { indicatorType, symbol, parameters, interval } = operand;
            const metadata = INDICATOR_METADATA[indicatorType];
            const label = metadata?.label || indicatorType || '';

            const parts: string[] = [];
            if (symbol) parts.push(symbol);
            if (label) parts.push(label.split(' ')[0]);

            const paramDisplayParts: string[] = [];
            if (metadata && parameters) { // Ensure parameters exist
                metadata.params.forEach(pMeta => {
                     const paramValue = (parameters as Record<string, any>)[pMeta.paramName];
                     if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
                         paramDisplayParts.push(String(paramValue));
                     }
                });
            }
            if (metadata?.requiresInterval && interval) {
                 paramDisplayParts.push(interval);
            }

            if (paramDisplayParts.length > 0) {
                parts.push(`(${paramDisplayParts.join(', ')})`);
            }

            return parts.length > 0 ? parts.join(' ') : 'Technical Indicator?';

         case OperandKind.MACRO_INDICATOR:
             return operand.indicatorType || 'Macro Indicator?';
        default:
            return "Unknown Condition";
    }
};


export const ConditionIfBlockComponent: React.FC<ConditionIfBlockSpecificProps> = ({
    block,
    strategyId,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    level,
    StrategyBlockRendererComponent
}) => {
    // --- State ---
    const isInitiallyUnconfigured = useMemo(() => {
        const params = block.parameters;
        return !params.leftOperand || params.leftOperand.kind === null ||
               !params.rightOperand || params.rightOperand.kind === null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [block.parameters.leftOperand, block.parameters.rightOperand]); 

    const [isEditing, setIsEditing] = useState(isInitiallyUnconfigured);

    const [conditionParams, setConditionParams] = useState<ConditionIfBlockParameters>(() => ({
        name: block.parameters.name || '',
        leftOperand: block.parameters.leftOperand ?? defaultOperand,
        operator: block.parameters.operator,
        rightOperand: block.parameters.rightOperand ?? defaultOperand,
    }));

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(conditionParams.name || '');

    useEffect(() => {
        if (!isInitiallyUnconfigured) {
            const newParams = block.parameters;
            setConditionParams({
                name: newParams.name || '',
                leftOperand: newParams.leftOperand ?? defaultOperand,
                operator: newParams.operator,
                rightOperand: newParams.rightOperand ?? defaultOperand,
            });
            setNameInput(newParams.name || '');
            // setIsEditing(false); // Keep this commented unless you specifically want external changes to close the form
        }
    }, [block.id, block.parameters, isInitiallyUnconfigured]);


    // --- Handlers ---
    const handleNameChange = (newName: string) => {
        const updatedName = newName || '';
        setConditionParams(prev => ({ ...prev, name: updatedName }));
        setNameInput(updatedName);
    };

    const handleNameSave = () => {
        setIsEditingName(false);
        // Optionally save immediately here if needed, but usually covered by handleSave
    };

    const handleNameCancel = () => {
        setNameInput(conditionParams.name || '');
        setIsEditingName(false);
    };

    const handleOperatorChange = (value: string) => {
        setConditionParams(prev => ({ ...prev, operator: value as Operator }));
    };

    const handleOperandSave = useCallback((operandSide: 'leftOperand' | 'rightOperand', config: ConditionOperand) => {
        setConditionParams(prev => ({
            ...prev,
            [operandSide]: config ?? defaultOperand
        }));
    }, []);

    const handleSave = async () => {
        if (!conditionParams.leftOperand || conditionParams.leftOperand.kind === null ||
            !conditionParams.rightOperand || conditionParams.rightOperand.kind === null ||
            !conditionParams.operator) {
            console.warn("Please configure both conditions and select an operator before saving.");
            return;
        }

        const finalParams: ConditionIfBlockParameters = {
             ...conditionParams,
             name: conditionParams.name || '',
        };

        console.log("Saving condition block with params:", finalParams);
        const updateData: UpdateBlockDto = { parameters: finalParams };

        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
            setIsEditingName(false);
        } catch (error) {
            console.error("Failed to update condition block:", error);
        }
    };

    const handleCancel = () => {
        // Reset state from original block props only if it wasn't initially unconfigured
        // If it was initially unconfigured, cancelling doesn't really mean anything
        // other than staying in the edit state (or maybe deleting, handled elsewhere)
        if (!isInitiallyUnconfigured) {
            const originalParams = block.parameters;
            setConditionParams({
                 name: originalParams.name || '',
                 leftOperand: originalParams.leftOperand ?? defaultOperand,
                 operator: originalParams.operator,
                 rightOperand: originalParams.rightOperand ?? defaultOperand,
            });
            setNameInput(originalParams.name || '');
            setIsEditing(false);
            setIsEditingName(false);
        } else {
             // If it *was* initially unconfigured, "Cancel" might be confusing.
             // Option 1: Do nothing (stay in edit mode) - Currently implied
             // Option 2: Treat it like delete? Risky without confirmation.
             // Option 3: Maybe disable the cancel button entirely as done in the JSX below.
             console.log("Cancel clicked on initially unconfigured block. No state reset.");
             // We could potentially still exit edit mode, but keep the invalid state?
             // setIsEditing(false); // Maybe? Depends on desired UX
             // setIsEditingName(false);
        }
    };

    // --- Memoized display string ---
    const displayConditionHeader = useMemo(() => {
        if (isEditing) return "Editing Condition...";

        const sourceParams = isEditingName ? conditionParams : block.parameters;
        const { leftOperand, operator, rightOperand, name } = sourceParams;

        const leftStr = formatOperandDisplay(leftOperand ?? defaultOperand);
        const rightStr = formatOperandDisplay(rightOperand ?? defaultOperand);
        const opStr = operator ?? '...';

        const conditionStr = `${leftStr} ${opStr} ${rightStr}`;
        const displayName = isEditingName ? nameInput : name;

        return displayName ? `${displayName}: ${conditionStr}` : conditionStr;
    }, [isEditing, conditionParams, block.parameters, isEditingName, nameInput]);

    const thenChildren = block.children ?? [];

    // --- Render ---
    return (
        <Card className="w-full border-blue-300 bg-blue-50/70 dark:border-blue-700/80 dark:bg-blue-950/50 shadow-sm dark:shadow-lg">
            {/* --- Card Header --- */}
            <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm min-h-[40px] dark:bg-blue-950/40">
                 {/* Left Side: Icon & Name */}
                <div className="flex items-center gap-2 flex-shrink-0 mr-2 min-w-0">
                    <Badge variant="outline" className="border-blue-600 text-blue-700 bg-white dark:border-blue-400/80 dark:text-blue-200 dark:bg-blue-900/60 px-1.5 py-0.5 flex-shrink-0">
                        <AlertCircle className="h-3 w-3 mr-1" /> If
                    </Badge>
                    {/* Name display/edit logic */}
                     {isEditing && !isEditingName ? (
                          <Button variant="ghost" className="h-7 px-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:text-blue-200 dark:hover:text-blue-100 dark:hover:bg-blue-900/40 truncate" onClick={() => setIsEditingName(true)} title={conditionParams.name || "Click to add name"}>
                              {conditionParams.name || "Name (optional)"}
                          </Button>
                     ) : isEditingName ? (
                         <div className="flex items-center">
                             <Input
                                 value={nameInput}
                                 onChange={(e) => handleNameChange(e.target.value)}
                                 className="h-7 text-sm px-2 w-40 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-100 dark:placeholder:text-blue-300"
                                 placeholder="Condition Name (optional)"
                                 autoFocus
                                 onBlur={handleNameSave}
                                 onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') handleNameCancel(); }}
                             />
                         </div>
                     ) : (
                         <span className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate flex-shrink min-w-0" title={displayConditionHeader}>
                             {displayConditionHeader}
                         </span>
                     )}
                </div>

                {/* Center Spacer */}
                 <div className="flex-grow"></div>


                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {!isEditing ? (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/40" onClick={() => { setIsEditing(true); setNameInput(conditionParams.name || ''); }}> <Edit className="h-3.5 w-3.5" /> </Button>
                    ) : (
                        <>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60" onClick={handleSave} title="Save Condition Block"> <Save className="h-3.5 w-3.5" /> </Button>
                            {!isInitiallyUnconfigured && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-blue-300 dark:hover:text-blue-100 hover:bg-gray-100 dark:hover:bg-blue-900/40" onClick={handleCancel} title="Cancel Edits"> <X className="h-4 w-4" /> </Button>
                            )}
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => onDeleteBlock(block.id)} title="Delete Condition Block"> <Trash2 className="h-3.5 w-3.5" /> </Button>
                </div>
            </CardHeader>

            {/* --- EDITING FORM --- */}
            {isEditing && (
                <CardContent className='p-3 pt-2 border-t border-blue-200 dark:border-blue-700/60 bg-white dark:bg-blue-950/30'>
                    {/* ... (keep existing form content: Operands, Operator Select, Validation message) ... */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {/* Left Operand Popover */}
                        <OperandConfigurationPopover
                            initialConfig={conditionParams.leftOperand}
                            onSave={(config) => handleOperandSave('leftOperand', config)}
                            onCancel={() => {}} // Popover handles its own cancel display
                            align="start"
                            trigger={
                                <Button
                                    variant={conditionParams.leftOperand?.kind ? "outline" : "outline"}
                                    className={cn(
                                        "h-9 w-full sm:w-auto justify-start text-left min-w-[140px] text-xs font-medium",
                                        !conditionParams.leftOperand?.kind && "border-dashed text-muted-foreground dark:text-blue-300 dark:border-blue-600",
                                        conditionParams.leftOperand?.kind && "border-solid border-input bg-background hover:bg-accent hover:text-accent-foreground dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200 dark:hover:bg-blue-800/60"
                                    )}
                                >
                                    <span className='truncate'>{formatOperandDisplay(conditionParams.leftOperand)}</span>
                                </Button>
                            }
                        />

                        {/* Operator Select */}
                         <div className="w-full sm:w-auto min-w-[120px]">
                             <Select value={conditionParams.operator} onValueChange={handleOperatorChange}>
                                <SelectTrigger className="h-9 text-xs dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200">
                                    <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-blue-950 dark:border-blue-700">
                                    {Object.values(Operator).filter(op => op).map(op => <SelectItem key={op} value={op} className="text-xs dark:text-blue-200 dark:hover:bg-blue-900/60">{op}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Right Operand Popover */}
                        <OperandConfigurationPopover
                             initialConfig={conditionParams.rightOperand}
                            onSave={(config) => handleOperandSave('rightOperand', config)}
                            onCancel={() => {}}
                            align="start"
                            trigger={
                                <Button
                                     variant={conditionParams.rightOperand?.kind ? "outline" : "outline"}
                                     className={cn(
                                        "h-9 w-full sm:w-auto justify-start text-left min-w-[140px] text-xs font-medium",
                                        !conditionParams.rightOperand?.kind && "border-dashed text-muted-foreground dark:text-blue-300 dark:border-blue-600",
                                        conditionParams.rightOperand?.kind && "border-solid border-input bg-background hover:bg-accent hover:text-accent-foreground dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200 dark:hover:bg-blue-800/60"
                                    )}
                                >
                                     <span className='truncate'>{formatOperandDisplay(conditionParams.rightOperand)}</span>
                                </Button>
                            }
                        />
                    </div>
                    {/* Validation message area */}
                     {(!conditionParams.leftOperand?.kind || !conditionParams.rightOperand?.kind || !conditionParams.operator) && (
                         <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">Please configure both conditions and select an operator.</p>
                     )}
                </CardContent>
            )}

            {/* --- THEN Branch Content --- */}
             {!isEditing && (
                 <CardContent className={`p-0 rounded-b-md ${thenChildren.length > 0 ? 'mt-0' : 'mt-0'}`}>
                    <div className="then-branch border-l-4 border-green-400 dark:border-green-500 ml-4 pl-3 py-2 space-y-1.5 bg-green-50/30 dark:bg-green-950/30 ">
                        <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-950/70 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600 text-xs font-medium px-1.5 py-0.5">
                                THEN
                            </Badge>
                            <AddBlockButton parentId={block.id} onAddBlock={onAddBlock} buttonSize='sm' />
                        </div>
                        {thenChildren.length > 0 ? (
                            thenChildren.map(child => (
                                <StrategyBlockRendererComponent
                                    key={child.id}
                                    block={child}
                                    strategyId={strategyId}
                                    onAddBlock={onAddBlock}
                                    onUpdateBlock={onUpdateBlock}
                                    onDeleteBlock={onDeleteBlock}
                                    level={level + 1}
                                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                                />
                            ))
                        ) : ( <p className="text-xs text-muted-foreground dark:text-green-300/70 italic px-1 py-1">No actions defined for THEN.</p> )}
                    </div>
                 </CardContent>
             )}
        </Card>
    );
};