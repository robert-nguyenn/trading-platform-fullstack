// app/strategies/[strategyId]/page.tsx
"use client";

import React, { useState } from 'react'; // Import useState if needed for page-level saving state
import { useParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import {
    Strategy,
    CreateBlockDto,
    UpdateBlockDto,
    UpdateStrategyDto // <-- IMPORT THIS
} from '@/lib/types';
import {
    getStrategy,
    createStrategyBlock,
    updateStrategyBlock,
    deleteStrategyBlock,
    updateStrategy // <-- IMPORT THIS
} from '@/lib/apiClient';
import apiClient from '@/lib/apiClient';
import { StrategyBlockRenderer } from '@/components/strategy/StrategyBlockRenderer';
import { StrategySidebar } from '@/components/strategy/StrategySidebar';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// import { toast } from 'sonner';

const strategyFetcher = (strategyId: string) => getStrategy(strategyId);

export default function StrategyBuilderPage() {
    const params = useParams();
    const strategyId = params.strategyId as string;

    const swrKey = strategyId ? `/strategies/${strategyId}` : null; // Use a key related to the data, not necessarily API path

    const {
        data: strategy,
        error,
        isLoading,
        mutate // Function to revalidate SWR cache
    } = useSWR<Strategy>(
        swrKey,
        () => strategyFetcher(strategyId),
        { revalidateOnFocus: false }
    );

    // State for sidebar saving operations (optional, could be managed within sidebar)
    // const [isUpdatingStrategy, setIsUpdatingStrategy] = useState(false);

    // --- API HANDLERS ---

    // Handler for updating strategy details (like investment amount from sidebar)
    const handleUpdateStrategy = async (id: string, data: UpdateStrategyDto) => {
        if (!strategyId || id !== strategyId) {
            console.error("Strategy ID mismatch or missing");
            // Optionally throw an error or show feedback
            // toast.error("Error: Strategy ID mismatch.");
            alert("Error: Strategy ID mismatch.");
            return; // Prevent API call
        }
        // setIsUpdatingStrategy(true); // Optional: manage loading state here
        console.log(`Attempting to update strategy ${id}:`, data);
        try {
            await updateStrategy(strategyId, data);
            console.log("Strategy updated successfully, revalidating...");
            // Revalidate the strategy data to get the latest version
            // This will update the 'strategy' prop passed to the sidebar
            mutate();
            // toast.success("Strategy settings updated!");
        } catch (err: any) {
            console.error("Failed to update strategy:", err);
            // toast.error(`Failed to update strategy: ${err.message || 'Unknown error'}`);
            alert(`ERROR updating strategy: ${err.message || 'See console'}`);
            // Rethrow error if sidebar handles its own errors/state based on promise rejection
            throw err;
        } finally {
            // setIsUpdatingStrategy(false); // Optional: manage loading state here
        }
    };


    const handleAddBlock = async (parentId: string | null, blockData: CreateBlockDto) => {
        if (!strategyId) return;
        console.log("Attempting to add block:", blockData);
        try {
            await createStrategyBlock(strategyId, blockData);
            console.log("Block added successfully, revalidating strategy data...");
            mutate();
            // toast.success("Block added successfully!");
        } catch (err: any) {
            console.error("Failed to add block:", err);
            // toast.error(`Failed to add block: ${err.message || 'Unknown error'}`);
            alert(`ERROR adding block: ${err.message || 'See console'}`);
        }
    };

    const handleUpdateBlock = async (blockId: string, updateData: UpdateBlockDto) => {
        if (!strategyId) return;
        console.log(`Attempting to update block ${blockId}:`, updateData);
        try {
            await updateStrategyBlock(strategyId, blockId, updateData);
             console.log("Block updated successfully, revalidating strategy data...");
            mutate();
             // toast.success("Block updated!");
        } catch (err: any) {
            console.error("Failed to update block (page.tsx):", err);
            // toast.error(`Failed to update block: ${err.message || 'Unknown error'}`);
            alert(`ERROR updating block: ${err.message || 'See console'}`);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (!strategyId) return;
        console.log(`Attempting to delete block ${blockId}`);
        if (window.confirm(`Are you sure you want to delete block ${blockId}? This cannot be undone.`)) {
            try {
                await deleteStrategyBlock(strategyId, blockId);
                console.log("Block deleted successfully, revalidating strategy data...");
                mutate();
                 // toast.success("Block deleted!");
            } catch (err: any) {
                console.error("Failed to delete block:", err);
                // toast.error(`Failed to delete block: ${err.message || 'Unknown error'}`);
                alert(`ERROR deleting block: ${err.message || 'See console'}`);
            }
        } else {
            console.log("Deletion cancelled for:", blockId);
        }
    };

    // --- RENDER LOGIC ---

    if (isLoading) {
        return <StrategyBuilderLoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="p-8 text-center max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Strategy</h1>
                <p className="text-muted-foreground mb-4">Could not fetch strategy data for ID: {strategyId}</p>
                <pre className="text-left bg-muted p-4 rounded text-sm overflow-auto">
                    {error.message || JSON.stringify(error, null, 2)}
                </pre>
            </div>
        );
    }

    if (!strategy || !strategy.rootBlock) {
        // Handle case where strategy exists but rootBlock is somehow null (shouldn't happen ideally)
        // Or the strategy itself is not found (though SWR error state might catch this first)
        return (
             <div className="p-8 text-center max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-orange-600">Strategy Not Found or Incomplete</h1>
                <p className="text-muted-foreground">Strategy data loaded, but it appears to be missing its core structure (root block) for ID: {strategyId}.</p>
                 {/* Optionally show raw data if strategy exists but rootBlock doesn't */}
                 {strategy && (
                     <details className="mt-4 text-left">
                         <summary className="cursor-pointer text-sm">View Raw Strategy Data</summary>
                         <pre className="mt-2 bg-muted p-4 rounded text-xs overflow-auto">
                             {JSON.stringify(strategy, null, 2)}
                         </pre>
                     </details>
                 )}
             </div>
        );
    }

    // --- Render the Strategy Builder with Sidebar ---
    return (
        // Use min-h-screen on outer container if needed, maybe flex-col
        <div className="flex flex-col h-screen"> {/* Make page container fill height */}

            {/* Header Section */}
            <div className="flex justify-between items-center p-4 md:px-8 border-b bg-background sticky top-0 z-10">
                 <div>
                     <h1 className="text-2xl font-semibold">{strategy.name}</h1>
                     {/* Optional: Keep description here or rely on sidebar */}
                     {/* <p className="text-sm text-muted-foreground mt-1">{strategy.description || 'No description.'}</p> */}
                 </div>
                 {/* Maybe move Save button or add other controls */}
                 {/* <Button size="sm">Save Strategy Changes</Button> */}
            </div>

            {/* Main Content Area (Sidebar + Builder) */}
            {/* Use flex-grow to make this area fill remaining vertical space */}
            {/* Use overflow-hidden on this flex container to manage internal scrolling */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                {/* Use overflow-y-auto for sidebar content scrolling if needed */}
                {/* flex-shrink-0 prevents the sidebar from shrinking */}
                <div className="w-72 lg:w-80 border-r overflow-y-auto p-4 flex-shrink-0 bg-background"> {/* Adjust width (w-*) and padding (p-*) as needed */}
                     <StrategySidebar
                        strategy={strategy}
                        onUpdateStrategy={handleUpdateStrategy}
                        // Pass mock account data if needed, or fetch real data
                     />
                </div>

                {/* Builder Canvas */}
                {/* flex-1 allows this area to grow and fill remaining space */}
                {/* overflow-y-auto enables scrolling *within* the builder area */}
                {/* min-width-0 is important for flex children that might overflow */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-width-0">
                     <div className="builder-canvas max-w-full"> {/* Ensure canvas doesn't exceed parent */}
                         <StrategyBlockRenderer
                            block={strategy.rootBlock}
                            strategyId={strategy.id}
                            onAddBlock={handleAddBlock}
                            onUpdateBlock={handleUpdateBlock}
                            onDeleteBlock={handleDeleteBlock}
                            level={0}
                            StrategyBlockRendererComponent={StrategyBlockRenderer}
                        />
                    </div>

                     {/* Optional Debug Data */}
                     {/* <details className="mt-8">
                         <summary className="cursor-pointer text-muted-foreground text-sm">View Raw Strategy Data (Debug)</summary>
                         <pre className="mt-2 bg-muted p-4 rounded text-xs overflow-auto">
                             {JSON.stringify(strategy, null, 2)}
                         </pre>
                     </details> */}
                </div>
            </div>
        </div>
    );
}


// --- Loading Skeleton Component ---
// (Keep the skeleton simple, focusing on the main layout before data loads)
const StrategyBuilderLoadingSkeleton = () => {
    return (
        <div className="flex flex-col h-screen animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center p-4 md:px-8 border-b">
                <div>
                    <Skeleton className="h-7 w-48 mb-1" />
                    {/* <Skeleton className="h-4 w-64" /> */}
                </div>
                {/* <Skeleton className="h-9 w-24" /> */}
            </div>

            {/* Main Content Skeleton */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Skeleton */}
                 <div className="w-72 lg:w-80 border-r p-4 flex-shrink-0 space-y-4">
                     <Skeleton className="h-6 w-3/4" /> {/* Title */}
                     <Skeleton className="h-3 w-full" /> {/* Description line 1 */}
                     <Skeleton className="h-3 w-5/6" /> {/* Description line 2 */}
                     <Skeleton className="h-px w-full bg-gray-200 dark:bg-gray-700 my-3" /> {/* Separator */}
                     <Skeleton className="h-5 w-1/2 mb-2" /> {/* Label */}
                     <Skeleton className="h-9 w-full" /> {/* Input */}
                     <Skeleton className="h-8 w-full mt-2" /> {/* Button */}
                     <Skeleton className="h-px w-full bg-gray-200 dark:bg-gray-700 my-3" /> {/* Separator */}
                     <Skeleton className="h-5 w-1/3 mb-2" /> {/* Label */}
                     <Skeleton className="h-4 w-full mb-1" /> {/* Info line */}
                     <Skeleton className="h-4 w-full" /> {/* Info line */}
                </div>

                {/* Builder Canvas Skeleton */}
                 <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <div className="pl-8"> <Skeleton className="h-10 w-11/12" /></div>
                    <Skeleton className="h-16 w-full" />
                    <div className="pl-8"> <Skeleton className="h-10 w-11/12" /></div>
                    <div className="pl-16"><Skeleton className="h-10 w-10/12" /></div>
                    <Skeleton className="h-12 w-full" />
                 </div>
            </div>
        </div>
    );
};