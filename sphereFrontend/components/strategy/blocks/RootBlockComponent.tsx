// src/components/strategy/blocks/RootBlockComponent.tsx
import React from 'react';
import { StrategyBlockRendererProps } from '../StrategyBlockRenderer';
import { AddBlockButton } from './AddBlockButton'; // Ensure path is correct

interface RootBlockProps extends StrategyBlockRendererProps {
    // Type is narrowed by Renderer
    // block.parameters is RootBlockParameters
    // Needs StrategyBlockRendererComponent for children
    StrategyBlockRendererComponent: React.FC<StrategyBlockRendererProps>;
}

export const RootBlockComponent: React.FC<RootBlockProps> = ({
    block,
    strategyId,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    level, // Current level (should be 0)
    StrategyBlockRendererComponent // Use this to render children
}) => {

    return (
        <div className="root-block-container"> {/* Root doesn't need indentation via padding */}
            {/* Add Block Button for top-level items */}
            <div className="mb-2"> {/* No pl needed if parent handles padding */}
                 <AddBlockButton parentId={block.id} onAddBlock={onAddBlock} buttonSize='sm'/>
            </div>

            {/* Render Children */}
            <div className="root-children-container space-y-1.5">
                {block.children && block.children.length > 0 ? (
                    block.children.map(child => (
                        <StrategyBlockRendererComponent
                            key={child.id}
                            block={child}
                            strategyId={strategyId}
                            onAddBlock={onAddBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDeleteBlock={onDeleteBlock}
                            level={level + 1} // Increment level for direct children
                            StrategyBlockRendererComponent={StrategyBlockRendererComponent}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground italic px-4 py-2">
                        Strategy is empty. Click "Add Block" to start building.
                    </p>
                )}
            </div>
        </div>
    );
};