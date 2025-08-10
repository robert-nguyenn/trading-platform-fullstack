import React, { useState, useEffect, ChangeEvent } from "react";
import { Strategy, UpdateStrategyDto, AllocationSummary } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Loader2, AlertCircle } from "lucide-react";
import { getAccountBalance, getAllocationSummary } from "@/lib/apiClient";
import { PortfolioCardSkeleton } from "../ui/portfolio-card-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StrategySidebarProps {
    strategy: Strategy;
    onUpdateStrategy: (strategyId: string, data: UpdateStrategyDto) => Promise<void>;
    className?: string;
}

export const StrategySidebar: React.FC<StrategySidebarProps> = ({
    strategy,
    onUpdateStrategy,
    className,
}) => {
    // --- State for Account Data ---
    const [accValue, setAccValue] = useState<number | null>(null);
    const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
    const [loadingAccount, setLoadingAccount] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- State for Allocation Data ---
    const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
    const [loadingAllocation, setLoadingAllocation] = useState<boolean>(true);

    // --- State for Editable Input ---
    const [currentInvestmentAmount, setCurrentInvestmentAmount] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // --- Fetch Account Data ---
    useEffect(() => {
        const fetchAccountBalance = async () => {
            try {
                setLoadingAccount(true);
                setError(null);
                const res = await getAccountBalance();
                const buyingPower = typeof res?.buying_power === 'string' ? parseFloat(res.buying_power) : res?.buying_power;
                const portValue = typeof res?.portfolio_value === 'string' ? parseFloat(res.portfolio_value) : res?.portfolio_value;

                setAccValue(isNaN(buyingPower) ? null : buyingPower);
                setPortfolioValue(isNaN(portValue) ? null : portValue);

            } catch (err: any) {
                console.error("Failed to fetch account balance:", err);
                setError(err.message || "Failed to fetch account balance.");
                setAccValue(null);
                setPortfolioValue(null);
            } finally {
                setLoadingAccount(false);
            }
        };

        fetchAccountBalance();
    }, []);

    // --- Fetch Allocation Summary ---
    useEffect(() => {
        const fetchAllocationSummary = async () => {
            try {
                setLoadingAllocation(true);
                const summary = await getAllocationSummary();
                setAllocationSummary(summary);
            } catch (err: any) {
                console.error("Failed to fetch allocation summary:", err);
            } finally {
                setLoadingAllocation(false);
            }
        };

        fetchAllocationSummary();
    }, []);

    // --- Initialize/Update local input state ---
    useEffect(() => {
        setCurrentInvestmentAmount(String(strategy.allocatedAmount ?? ""));
    }, [strategy.allocatedAmount]);

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "$--.--";
        return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
    };

    // --- Handle Input Change ---
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
         if (/^\d*\.?\d*$/.test(value)) {
           setCurrentInvestmentAmount(value);
           setValidationError(null); // Clear validation error when user types
         }
    };

    // --- Handle Update Button Click ---
    const handleUpdateClick = async () => {
        const amountToSave = parseFloat(currentInvestmentAmount);
        
        // Basic validation
        if (isNaN(amountToSave) || amountToSave < 0) {
            setValidationError("Invalid investment amount entered.");
            return;
        }

        // Check against available funds
        if (allocationSummary && amountToSave > allocationSummary.availableToAllocate + (strategy.allocatedAmount || 0)) {
            const maxAllowable = allocationSummary.availableToAllocate + (strategy.allocatedAmount || 0);
            setValidationError(`Insufficient funds. Maximum available: ${formatCurrency(maxAllowable)}`);
            return;
        }

        setIsSaving(true);
        setValidationError(null);
        
        try {
            await onUpdateStrategy(strategy.id, { allocatedAmount: amountToSave });
            console.log("Update successful");
            
            // Refresh allocation summary after successful update
            const summary = await getAllocationSummary();
            setAllocationSummary(summary);
        } catch (updateError: any) {
            console.error("Failed to update strategy:", updateError);
            setValidationError(updateError.response?.data?.error || "Failed to update allocation");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Calculate Allocation Percentage ---
     const currentAmountNumber = parseFloat(currentInvestmentAmount || "0");
     const allocationPercentage =
         portfolioValue && currentAmountNumber > 0
             ? ((currentAmountNumber / portfolioValue) * 100).toFixed(1)
             : "0.0";


    return (
        <Card className={`w-full max-w-sm flex flex-col ${className}`}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-3">
                    {strategy.description || "No description provided."}
                </CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="flex-grow pt-4 space-y-5">
                {/* --- Account Info Section --- */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Account Overview</h4>
                    {loadingAccount ? (
                        <PortfolioCardSkeleton />
                    ) : error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Total Portfolio Value:</span>
                                <span className="font-medium">{formatCurrency(portfolioValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Available Buying Power:</span>
                                <span className="font-medium">{formatCurrency(accValue)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Allocation Summary Section --- */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Allocation Overview</h4>
                    {loadingAllocation ? (
                        <PortfolioCardSkeleton />
                    ) : allocationSummary ? (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Total Funds:</span>
                                <span className="font-medium">{formatCurrency(allocationSummary.availableFunds)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Currently Allocated:</span>
                                <span className="font-medium">{formatCurrency(allocationSummary.totalAllocated)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Available to Allocate:</span>
                                <span className="font-medium text-green-600">{formatCurrency(allocationSummary.availableToAllocate)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-1 border-t">
                                <span className="text-muted-foreground">Active Strategies:</span>
                                <span className="font-medium">{allocationSummary.summary.strategiesWithAllocation}/{allocationSummary.summary.totalStrategies}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-red-600">Failed to load allocation data</p>
                    )}
                </div>

                <Separator />

                {/* --- Investment Allocation Section --- */}
                <div className="space-y-2">
                    <Label htmlFor="investment-amount" className="text-sm font-medium">
                        Strategy Allocation
                    </Label>
                    
                    {validationError && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                {validationError}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="investment-amount"
                            type="text"
                            inputMode="decimal"
                            value={currentInvestmentAmount}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            className="pl-7 pr-2 h-9 text-sm"
                            disabled={loadingAccount || loadingAllocation || isSaving}
                        />
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="text-center">
                            ~ {allocationPercentage}% of Total Portfolio Value
                        </p>
                        {allocationSummary && (
                            <p className="text-center">
                                Max available: {formatCurrency(allocationSummary.availableToAllocate + (strategy.allocatedAmount || 0))}
                            </p>
                        )}
                    </div>
                    
                    <Button
                        onClick={handleUpdateClick}
                        disabled={loadingAccount || loadingAllocation || isSaving || !currentInvestmentAmount}
                        className="w-full h-8 text-xs mt-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                            </>
                        ) : (
                            "Update Allocation"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};