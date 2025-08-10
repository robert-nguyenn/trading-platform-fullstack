// src/components/strategy/StrategyBlockRenderer.tsx
import React from 'react';
// Import types, including the new detailed ones
import {
    StrategyBlockWithChildren,
    CreateBlockDto,
    UpdateBlockDto,
    StrategyBlockType
} from '@/lib/types';

// Import specific block components
import { RootBlockComponent } from './blocks/RootBlockComponent';
import { AssetBlockComponent } from './blocks/AssetBlockComponent';
import { WeightBlockComponent } from './blocks/WeightBlockComponent';
import { ConditionIfBlockComponent } from './blocks/ConditionIfBlockComponent';
import { GroupBlockComponent } from './blocks/GroupBlockComponent';
import { FilterBlockComponent } from './blocks/FilterBlockComponent';
import { ActionBlockComponent } from './blocks/ActionBlockComponent';

export interface StrategyBlockRendererProps {
    block: StrategyBlockWithChildren; // Uses the strongly-typed recursive block
    strategyId: string;
    onAddBlock: (parentId: string | null, blockData: CreateBlockDto) => Promise<void>;
    onUpdateBlock: (blockId: string, updateData: UpdateBlockDto) => Promise<void>;
    onDeleteBlock: (blockId: string) => Promise<void>;
    /** Current nesting level for indentation */
    level: number; // Make level required here
    /** Pass the renderer itself for recursive calls */
    StrategyBlockRendererComponent: React.FC<StrategyBlockRendererProps>;
}

export const StrategyBlockRenderer: React.FC<StrategyBlockRendererProps> = ({
    block, // The specific block instance for this render call
    strategyId,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    level,
    StrategyBlockRendererComponent, // The renderer component itself
}) => {

    // No need for commonBlockProps here anymore

    const renderSpecificBlock = () => {
        // TypeScript automatically narrows `block` type inside each case
        switch (block.blockType) {
            case StrategyBlockType.ROOT:
                return <RootBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.ASSET:
                return <AssetBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock} // Pass required props even if not used internally by Asset
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.WEIGHT:
                return <WeightBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.CONDITION_IF:
                return <ConditionIfBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.GROUP:
                return <GroupBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.FILTER:
                return <FilterBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock} // Pass required props
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
            case StrategyBlockType.ACTION:
                return <ActionBlockComponent
                    // Pass the narrowed block directly
                    block={block}
                    strategyId={strategyId}
                    onAddBlock={onAddBlock} // Pass required props
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    level={level}
                    StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                />;
                default:
                    // Use 'never' type check for exhaustiveness (optional)
                    // const _exhaustiveCheck: never = block;
                    // Cast block to access common properties safely in this unexpected case
                    const unknownBlock = block as { id: string; blockType?: string };
                    console.warn("Unsupported block type encountered:", unknownBlock?.blockType);
                    return (
                        <div className="p-2 my-1 border border-dashed border-red-400 text-red-600 bg-red-50/80 rounded">
                            {/* Access properties via the cast variable */}
                            Unsupported Block Type: {unknownBlock?.blockType ?? 'Unknown'} (ID: {unknownBlock?.id ?? 'Unknown'})
                        </div>
                    );
        }
    };

    // Apply indentation based on level
    const indentationStyle = { paddingLeft: `${level * 1.5}rem` };

    return (
        <div
            className={`block-container block-type-${block.blockType.toLowerCase()} mb-1.5`}
            style={indentationStyle}
            data-block-id={block.id}
        >
            {renderSpecificBlock()}
        </div>
    );
};