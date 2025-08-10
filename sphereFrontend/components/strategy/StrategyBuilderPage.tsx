"use client";

import { useState } from 'react'; // Keep useState if needed for UI state like unsaved changes
import { useParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { getStrategy, updateStrategyBlock, createStrategyBlock, deleteStrategyBlock } from '@/lib/apiClient';
// Import necessary types
import {
    Strategy,
    StrategyBlockWithChildren, // This now uses TypedStrategyBlock
    CreateBlockDto,
    UpdateBlockDto
} from '@/lib/types';
import { Button } from "@/components/ui/button";
import { StrategyBlockRenderer } from '@/components/strategy/StrategyBlockRenderer';
// import { StrategyDetailsSidebar } from '@/components/strategy/StrategyDetailsSidebar'; // Placeholder

export default function StrategyBuilderPage() {
    const params = useParams();
    const strategyId = params.strategyId as string;
    const { mutate } = useSWRConfig();

    // Fetch strategy data - Ensure getStrategy returns Promise<Strategy> for correct typing
    const { data: strategy, error, isLoading, isValidating } = useSWR<Strategy>(
        strategyId ? `/strategies/${strategyId}` : null,
        () => getStrategy(strategyId),
        { revalidateOnFocus: false } // Optional: Adjust SWR options as needed
    );

    // Handlers remain largely the same, accepting DTOs.
    // The responsibility of creating correctly structured 'parameters'
    // within the DTOs lies with the specific block components.
    const handleAddBlock = async (parentId: string | null, blockData: CreateBlockDto) => {
        if (!strategy || !strategyId) return;
        // Add client-side validation or default parameter generation here if needed
        // before sending to API, based on blockData.blockType
        console.log("Adding block:", blockData);
        try {
            await createStrategyBlock(strategyId, blockData);
            mutate(`/strategies/${strategyId}`); // Revalidate
        } catch (err) {
            console.error("Failed to add block:", err);
            // TODO: Show error toast to user
        }
    };

    const handleUpdateBlock = async (blockId: string, updateData: UpdateBlockDto) => {
         if (!strategy || !strategyId) return;
         console.log("Updating block:", blockId, updateData);
        try {
            await updateStrategyBlock(strategyId, blockId, updateData);
             // Optimistic update example (optional, using SWR mutate)
             // mutate(`/strategies/${strategyId}`, (currentData) => {
             //     if (!currentData) return currentData;
             //     // TODO: Implement logic to find and update the block optimistically
             //     // This is complex for nested structures!
             //     return updatedStrategyData;
             // }, false); // false = don't revalidate yet
             mutate(`/strategies/${strategyId}`); // Revalidate to get confirmed state
        } catch (err) {
            console.error("Failed to update block (StrategyBuilderPage.tsx):", err);
             // TODO: Show error toast to user
             // Revert optimistic update if implemented
             // mutate(`/strategies/${strategyId}`);
        }
    };

     const handleDeleteBlock = async (blockId: string) => {
         if (!strategy || !strategyId) return;
         if (!confirm(`Are you sure you want to delete block ${blockId}?`)) return; // Simple confirmation
         console.log("Deleting block:", blockId);
        try {
            await deleteStrategyBlock(strategyId, blockId);
             mutate(`/strategies/${strategyId}`); // Revalidate
        } catch (err) {
            console.error("Failed to delete block:", err);
             // TODO: Show error toast to user
        }
    };

    // --- Render Logic ---
    if (isLoading) return <div className='p-4'>Loading strategy...</div>;
    // Use a more specific error check if needed
    if (error) return <div className='p-4 text-red-600'>Error loading strategy: {error?.message || 'Unknown error'}</div>;
    // Ensure rootBlock exists after loading and no error
    if (!strategy?.rootBlock) return <div className='p-4'>Strategy data loaded, but Root Block is missing.</div>;


    return (
        <div className="flex h-screen bg-gray-50">
             {/* <StrategyDetailsSidebar strategy={strategy} /> */}

            <main className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">{strategy.name}</h1>
                    {/* TODO: Implement Save (maybe track dirty state) and add Loading/Saving indicators */}
                    <Button disabled={isValidating}>
                         {isValidating ? 'Syncing...' : 'Save Changes'}
                    </Button>
                </div>

                {/* Render the strategy starting from the root block */}
                <StrategyBlockRenderer
                    key={strategy.rootBlock.id} // Add key for potential root replacement
                    block={strategy.rootBlock}
                    strategyId={strategy.id}
                    onAddBlock={handleAddBlock}
                    onUpdateBlock={handleUpdateBlock}
                    onDeleteBlock={handleDeleteBlock}
                    // Pass the Renderer component itself for recursion
                    StrategyBlockRendererComponent={StrategyBlockRenderer}
                    level={0} // Start level at 0
                />
            </main>
        </div>
    );
}