import React, { useState, useMemo, useEffect } from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
// Import specific types NEEDED by this component
import {
    UpdateBlockDto,
    StrategyBlockType,
    StrategyBlockWithChildren, // Keep for Extract
    GroupBlockParameters     // This component uses Group parameters
} from '@/lib/types';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit, Save, X, BarChart3 } from 'lucide-react';
import { AddBlockButton } from './AddBlockButton'; // Corrected path

// --- Define Specific Props ---
interface GroupBlockSpecificProps extends Omit<StrategyBlockRendererProps, 'block' | 'level'> {
    // Override 'block' to be ONLY the Group block type extracted from the union
    block: Extract<StrategyBlockWithChildren, { blockType: StrategyBlockType.GROUP }>;
    // Ensure StrategyBlockRendererComponent is explicitly required if needed
    StrategyBlockRendererComponent: React.FC<StrategyBlockRendererProps>;
    level: number; // Make level required if used consistently
}

// --- Use the Specific Props Interface ---
export const GroupBlockComponent: React.FC<GroupBlockSpecificProps> = ({
    block, // Now TypeScript KNOWS block.parameters is GroupBlockParameters
    strategyId,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    level,
    StrategyBlockRendererComponent
}) => {

    // determine if this block is initially unconfigured
    const isInitiallyUnconfigured = useMemo(() => {
        const hasChildren = Boolean(block.children?.length);
        return !hasChildren; // Only consider "unconfigured" if no children
      }, [block.children]);

    const [isEditing, setIsEditing] = useState(isInitiallyUnconfigured);
    // Toggles whether the entire block is being edited (e.g. name, plus add-children button display)
    // const [isEditing, setIsEditing] = useState(false);

    // Additional toggle specifically for the name input behavior:
    const [isEditingName, setIsEditingName] = useState(false);
    // We'll keep a separate piece of state to hold the name input so we can blur or save as done in ConditionIfBlock
    const [nameInput, setNameInput] = useState<string>(block.parameters.name);

    // Local state for the final name that is used in the block parameters
    const [groupName, setGroupName] = useState<string>(block.parameters.name);
    // If you also need description logic, reintroduce it here:
    // const [description, setDescription] = useState<string>(block.parameters.description || '');
    // useEffect to set initial state
    useEffect(() => {
        if (!isInitiallyUnconfigured){
            setGroupName(block.parameters.name);
            setNameInput(block.parameters.name);
            // setDescription(block.parameters.description || '');
        }
    }, [block.id, block.parameters.name, isInitiallyUnconfigured]);
    // --- Helpers and Handlers ---

    // This runs whenever you press the “Save” (disk icon) for the entire block
    const handleSave = async () => {
        // if (!groupName) {
        //     console.error("Group Name cannot be empty");
        //     // TODO: Show validation error
        //     return;
        // }
        // Construct parameters matching GroupBlockParameters
        const updatedParams: GroupBlockParameters = {
            name: groupName,
            // description: description || undefined,
        };
        const updateData: UpdateBlockDto = { parameters: updatedParams };
        try {
            await onUpdateBlock(block.id, updateData);
            setIsEditing(false);
            setIsEditingName(false);
        } catch (error) {
            console.error("Failed to update group block:", error);
        }
    };

    // Cancels and discards changes to the entire block
    const handleCancel = () => {
        // Reset states directly from typed parameters
        setGroupName(block.parameters.name);
        setNameInput(block.parameters.name); // Also reset the nameInput
        // setDescription(block.parameters.description || '');
        setIsEditing(false);
        setIsEditingName(false);
    };

    // For specifically applying nameInput changes to local groupName state
    const handleNameSave = () => {
        // The user ended editing the name input (on blur, or hit Enter)
        setGroupName(nameInput || '');
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        // If they press Escape while editing the name, revert changes
        setNameInput(groupName); // revert input to previously saved groupName
        setIsEditingName(false);
    };

    // Display variables for convenience
    const displayName = groupName;
    // If you want to show description somewhere, uncomment below:
    // const displayDescription = description;

    return (
        <Card className="w-full border-orange-300 bg-orange-50/70 dark:border-orange-600 dark:bg-orange-950/30 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-1.5 px-3 text-sm">
                <div className="flex items-center gap-2 flex-grow mr-2 overflow-hidden">
                    <Badge variant="outline" className="border-orange-600 text-orange-700 bg-white dark:border-orange-400 dark:text-orange-300 dark:bg-orange-950/50 px-1.5 py-0.5 flex-shrink-0">
                         <BarChart3 className="h-3 w-3 mr-1" /> Group
                    </Badge>

                    {/* Name handling similar to ConditionIfBlockComponent */}
                    {isEditing && !isEditingName ? (
                        // Show button that triggers name input edit, if isEditing is true but isEditingName is false
                        <Button
                            variant="ghost"
                            className="h-7 px-2 text-sm font-medium text-muted-foreground hover:text-foreground truncate"
                            onClick={() => {
                                setIsEditingName(true);
                            }}
                            title={groupName || "Click to add name"}
                        >
                            {groupName || "Name (optional)"}
                        </Button>
                    ) : isEditingName ? (
                        // Show name input when isEditingName is true
                        <div className="flex items-center">
                            <Input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="h-7 text-sm px-2 w-40"
                                placeholder="Group Name*"
                                autoFocus
                                required
                                onBlur={handleNameSave} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameSave();
                                    if (e.key === 'Escape') handleNameCancel();
                                }}
                            />
                        </div>
                    ) : (
                        // Show static name when not in “block editing mode”
                        <div className='flex flex-col items-start'>
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate" title={displayName}>
                                {displayName}
                            </span>
                            {/* If you want to render description beneath name, uncomment below:
                                {displayDescription && (
                                    <span className="text-xs text-muted-foreground truncate" title={displayDescription}>
                                        {displayDescription}
                                    </span>
                                )}
                            */}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0 self-start pt-0.5">
                    {/* Toggle entire block editing */}
                    {!isEditing ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground"
                            onClick={() => setIsEditing(true)}
                            title="Edit Group"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-600"
                                onClick={handleSave}
                                title="Save Group"
                            >
                                <Save className="h-3.5 w-3.5" />
                            </Button>
                            {!isInitiallyUnconfigured && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground"
                                    onClick={handleCancel}
                                    title="Cancel Edits"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => onDeleteBlock(block.id)}
                        title="Delete Group"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardHeader>

            {/* Render Children and Add Button Inside CardContent */}
            <CardContent className="pt-1 pb-2 px-2 pl-4 space-y-1 border-t border-orange-200">
                {/* Render Children - Indentation/border applied by CardContent/parent */}
                {block.children && block.children.length > 0 && (
                    <div className="group-children-container space-y-1.5">
                        {block.children.map(child => (
                            <StrategyBlockRendererComponent
                                key={child.id}
                                block={child}
                                strategyId={strategyId}
                                onAddBlock={onAddBlock}
                                onUpdateBlock={onUpdateBlock}
                                onDeleteBlock={onDeleteBlock}
                                level={level + 1} // Children are one level deeper
                                StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                            />
                        ))}
                    </div>
                )}
                {/* Add Block Button inside the group, only visible when editing */}
                {isEditing && (
                    <div className="pt-1 ml-2">
                        <AddBlockButton
                            parentId={block.id}
                            onAddBlock={onAddBlock}
                            buttonLabel="Add to Group"
                            buttonSize='sm'
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};