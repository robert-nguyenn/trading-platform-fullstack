// app/strategies/page.tsx
"use client";

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use navigation for App Router
import useSWR, { mutate as globalMutate } from 'swr'; // Import global mutate for refreshing list
import { useAuth } from '@/app/auth-provider';
import { Strategy, CreateStrategyDto, UpdateStrategyDto } from '@/lib/types';
import { getStrategies, createStrategy, deleteStrategy,updateStrategy } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';

import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Loader2, User } from 'lucide-react'; // Added Loader2 for submitting state
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose, // To close modal easily
} from "@/components/ui/dialog"; // Import Dialog components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea'; // For description
// Optional: import toast for feedback
// import { toast } from 'sonner';

// Fetcher remains the same
const strategiesFetcher = async ([, userId]: [string, string | null]): Promise<Strategy[]> => {
    console.log("strategiesFetcher called with userId:", userId);
    if (!userId) {
        throw new Error("User ID is required to fetch strategies.");
    }
    // Ensure API client is correctly configured for auth if needed
    // You might need to call setAuthToken here or use interceptors
    // Example: const token = localStorage.getItem('authToken'); setAuthToken(token);
    return getStrategies();
};

export default function StrategiesListPage() {
    const { user, loading: authLoading, getToken } = useAuth(); // Get user, loading state, and getToken
    const router = useRouter(); // Correctly initialize useRouter inside the component
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newStrategyName, setNewStrategyName] = useState("");
    const [newStrategyDescription, setNewStrategyDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // --- IMPORTANT: Revert to dynamic user ID when auth is stable ---
    const userId = user?.uid;
    // Hardcoded for testing - REMEMBER TO CHANGE BACK
    
    // ---------------------------------------------------------------

    // Set auth token when component mounts or user changes (if using manual token setting)
    useEffect(() => {
    const setToken = async () => {
        const token = await getToken(); // Get token using your auth context method
            // Make sure setAuthToken is imported or available if needed
            // setAuthToken(token);
            console.log("Auth token potentially set for API calls.");
    };
    if (user) { // Only attempt if user exists
        // setToken(); // Uncomment if your apiClient doesn't use interceptors
    }
    }, [user, getToken]);


    const swrKey = userId ? ['/api/strategies', userId] : null;

    const {
        data: strategies,
        error,
        isLoading: strategiesLoading,
        mutate: refreshStrategiesList // Function to specifically refresh this list
    } = useSWR<Strategy[]>(
        swrKey,
        strategiesFetcher,
        {
            revalidateOnFocus: false,
            onError: (err) => {
                console.error("SWR Error fetching strategies:", err);
                // Potentially handle specific errors like 401 Unauthorized here
            }
        }
    );

    const isLoading = authLoading || (userId && strategiesLoading);

    // Handler to open the modal
    const handleOpenCreateModal = () => {
        setNewStrategyName(""); // Reset fields when opening
        setNewStrategyDescription("");
        setCreateError(null); // Clear previous errors
        setIsCreateModalOpen(true);
    };

    const handleActivityStatusChange = async (strategyId: string, isActive: boolean) => {
        const status = !isActive;
        if (!userId) return; //
        //  Ensure user is logged in
        const updateData: UpdateStrategyDto = { isActive: status };

        try {
            console.log("Updating strategy status with data:", updateData);
            await updateStrategy(strategyId, updateData); // Call the API to update
            console.log("Strategy status updated successfully.");
            refreshStrategiesList(); // Refresh the list after updating
        }
        catch (err: any) {
            console.error("Failed to update strategy status:", err);
            const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
            setCreateError(`Failed to update strategy status: ${errorMessage}`);
            // toast.error(`Failed to update strategy status: ${errorMessage}`);
        }
    }
    // Handler for submitting the new strategy from the modal
    const handleModalSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); // Prevent default form submission
        if (!userId || !newStrategyName.trim()) {
            setCreateError("Strategy name is required.");
            return;
        }
        setCreateError(null);
        setIsSubmitting(true);

        const creationData: CreateStrategyDto = {
            userId: userId,
            name: newStrategyName.trim(),
            description: newStrategyDescription.trim() || undefined, // Send undefined if empty
        };

        try {
            console.log("Creating strategy with data:", creationData);
            const newStrategy = await createStrategy(creationData);
            console.log("Strategy created successfully:", newStrategy);

            // toast.success(`Strategy "${newStrategy.name}" created!`); // Optional feedback

            // Close modal and reset state
            setIsCreateModalOpen(false);
            setNewStrategyName("");
            setNewStrategyDescription("");

            // Refresh the list in the background (optional, happens on next focus/interval anyway)
            refreshStrategiesList(); // Re-fetch the strategies list data

            // Navigate to the new strategy's builder page
            router.push(`/strategies/${newStrategy.id}`);

        } catch (err: any) {
            console.error("Failed to create strategy:", err);
            const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
            setCreateError(`Failed to create strategy: ${errorMessage}`);
            // toast.error(`Failed to create strategy: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStrategyDelete = async(strategyId: string) => {
        // change this to a dialog box instead of the window for later. 
        if (!window.confirm("Are you sure you want to delete this strategy? This action cannot be undone.")) {
            return;
        }
        try{ 
            await deleteStrategy(strategyId)
            refreshStrategiesList();
        } catch (error: any) {
            console.error("Failed to delete strategy:", error); // Optionally, display an error message to the user.
        }
    }

    // --- Render Logic ---

    const renderContent = () => {
        // 1. Handle Loading State
        if (isLoading) {
            return <StrategiesListLoadingSkeleton />;
        }

        // 2. Handle Error State
        if (error && !strategies) { // Only show full error if no data is available at all
             // Don't show the fetcher's "User ID required" error if auth is just loading
             if (error.message === "User ID is required to fetch strategies." && authLoading) {
                 return <StrategiesListLoadingSkeleton />; // Show loading if auth is the blocker
             }
            return (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">
                    <p className="font-semibold">Error loading strategies:</p>
                    <p className="text-sm mt-1">{error.message}</p>
                </div>
            );
        }

        // 3. Handle No Strategies Found (or empty array after loading)
        if (!strategies || strategies.length === 0) {
            return (
                <div className="text-center border-2 border-dashed border-gray-300 p-10 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700">No strategies found</h3>
                    <p className="text-muted-foreground mt-2 mb-4">Get started by creating your first trading strategy.</p>
                    {/* Button to open the creation modal */}
                    <Button onClick={handleOpenCreateModal}>
                         <PlusCircle className="mr-2 h-4 w-4" /> Create New Strategy
                    </Button>
                </div>
            );
        }

        // 4. Render the List of Strategies
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                    <Card key={strategy.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                            <CardTitle className="hover:text-primary">
                                <Link href={`/strategies/${strategy.id}`} className="block">
                                    {strategy.name || 'Untitled Strategy'}
                                </Link>
                            </CardTitle>
                            <CardDescription>
                                {strategy.description || 'No description provided.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="space-y-2">
                                <p className={`text-xs font-medium ${strategy.isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {strategy.isActive ? 'Active' : 'Inactive'}
                                </p>
                                
                                {/* Allocation Information */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Allocated:</span>
                                        <span className="font-medium">
                                            {strategy.allocatedAmount 
                                                ? `$${strategy.allocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : '$0.00'
                                            }
                                        </span>
                                    </div>
                                    {strategy.allocatedAmount && strategy.allocatedAmount > 0 && (
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ width: '75%' }} // You can calculate actual percentage if you have total portfolio value
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`w-12 h-6 p-0 flex items-center rounded-full border ${
                                        strategy.isActive ? 'bg-green-100 border-green-500 justify-end' : 'bg-gray-100 border-gray-400 justify-start'
                                    }`}
                                    onClick={() => handleActivityStatusChange(strategy.id, strategy.isActive)}
                                >
                                    <span
                                        className={`w-5 h-5 rounded-full transition-all duration-300 ease-in-out ${
                                            strategy.isActive ? 'bg-green-500' : 'bg-gray-400'
                                        }`}
                                    />
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
                            <p className="mr-2">Last updated: {new Date(strategy.updatedAt).toLocaleDateString()}</p>
                            <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/strategies/${strategy.id}`}>Edit</Link>
                                </Button>
                                <Button variant="ghost" size="default" className="hover:bg-red-400" onClick={() => handleStrategyDelete(strategy.id)}>Delete</Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <>
        {/* <Navbar /> */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-8 pb-4 border-b">
                <h1 className="text-3xl font-bold">My Strategies</h1>
                 {/* Show create button only if logged in and not loading */}
                 { !isLoading && userId && (
                     <Button onClick={handleOpenCreateModal}>
                         <PlusCircle className="mr-2 h-4 w-4" /> Create New Strategy
                    </Button>
                 )}
            </div>

            {renderContent()}

             {/* Create Strategy Dialog (Modal) */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                 {/* DialogTrigger is usually used if you want a specific element to open the dialog,
                     but here we control it with state via the `open` prop, so Trigger isn't strictly needed */}
                 {/* <DialogTrigger asChild><Button>Open Manually</Button></DialogTrigger> */}
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleModalSubmit}> {/* Wrap in form for Enter key submission */}
                        <DialogHeader>
                            <DialogTitle>Create New Strategy</DialogTitle>
                            <DialogDescription>
                                Give your new strategy a name and optional description. You'll configure the logic next.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newStrategyName}
                                    onChange={(e) => setNewStrategyName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g., Momentum Breakout"
                                    required // Make name required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={newStrategyDescription}
                                    onChange={(e) => setNewStrategyDescription(e.target.value)}
                                    className="col-span-3"
                                    placeholder="(Optional) Describe the goal or logic of this strategy"
                                    rows={3}
                                />
                            </div>
                             {createError && (
                                 <p className="text-sm text-red-600 col-span-4 text-center">{createError}</p>
                             )}
                        </div>
                        <DialogFooter>
                             <DialogClose asChild>
                                 <Button type="button" variant="outline" disabled={isSubmitting}>
                                    Cancel
                                </Button>
                             </DialogClose>
                            <Button type="submit" disabled={isSubmitting || !newStrategyName.trim()}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                         Creating...
                                    </>
                                ) : (
                                    "Create & Edit Strategy"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
        </>
    );
}

// Loading Skeleton Component remains the same
const StrategiesListLoadingSkeleton = () => {
    // ... (Skeleton code from previous response)
     return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => ( // Render 3 skeleton cards
                 <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" /> {/* Title */}
                        <Skeleton className="h-4 w-full" />    {/* Description line 1 */}
                         <Skeleton className="h-4 w-5/6" />    {/* Description line 2 */}
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-4 w-16" />      {/* Status */}
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-4 w-28" />      {/* Last updated */}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};