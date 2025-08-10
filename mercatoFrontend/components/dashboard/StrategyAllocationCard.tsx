"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';
import { getAllocationSummary } from '@/lib/apiClient';
import { AllocationSummary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export const StrategyAllocationCard: React.FC = () => {
    const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllocationSummary = async () => {
            try {
                setLoading(true);
                setError(null);
                const summary = await getAllocationSummary();
                setAllocationSummary(summary);
            } catch (err: any) {
                console.error("Failed to fetch allocation summary:", err);
                setError(err.message || "Failed to load allocation data");
            } finally {
                setLoading(false);
            }
        };

        fetchAllocationSummary();
    }, []);

    const formatCurrency = (value: number | undefined | null) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "$0.00";
        }
        return value.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Strategy Allocations
                    </CardTitle>
                    <CardDescription>Your fund allocation across strategies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        );
    }

    if (error || !allocationSummary) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Strategy Allocations
                    </CardTitle>
                    <CardDescription>Unable to load allocation data</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-600">{error}</p>
                </CardContent>
            </Card>
        );
    }

    const allocationPercentage = allocationSummary.availableFunds > 0 
        ? (allocationSummary.totalAllocated / allocationSummary.availableFunds) * 100 
        : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Strategy Allocations
                </CardTitle>
                <CardDescription>Your fund allocation across strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Funds</p>
                        <p className="text-lg font-semibold">{formatCurrency(allocationSummary.availableFunds)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Available</p>
                        <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(allocationSummary.availableToAllocate)}
                        </p>
                    </div>
                </div>

                {/* Allocation Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Allocated</span>
                        <span className="text-sm text-muted-foreground">
                            {allocationPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <Progress value={allocationPercentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                        {formatCurrency(allocationSummary.totalAllocated)} of {formatCurrency(allocationSummary.availableFunds)}
                    </p>
                </div>

                {/* Strategy Breakdown */}
                {allocationSummary.allocations.length > 0 ? (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Active Allocations</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {allocationSummary.allocations.map((allocation) => (
                                <div key={allocation.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${allocation.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="truncate max-w-32">{allocation.name}</span>
                                    </div>
                                    <span className="font-medium">
                                        {formatCurrency(allocation.allocatedAmount || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">No strategies allocated yet</p>
                        <Button size="sm" asChild>
                            <Link href="/strategies">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Strategy
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                    <span>{allocationSummary.summary.strategiesWithAllocation} allocated</span>
                    <span>{allocationSummary.summary.totalStrategies} total strategies</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href="/strategies">View All</Link>
                    </Button>
                    {allocationSummary.availableToAllocate > 0 && (
                        <Button size="sm" asChild className="flex-1">
                            <Link href="/strategies">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Allocate
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
