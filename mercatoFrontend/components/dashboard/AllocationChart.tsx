import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/apiClient';

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export const AllocationChart: React.FC = () => {
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllocationData = async () => {
      try {
        const response = await apiClient.get('/portfolio/allocation');
        setAllocationData(response.data);
      } catch (err) {
        console.error('Failed to fetch allocation data:', err);
        setError('Failed to load allocation data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllocationData();
  }, []);

  const total = allocationData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>Current asset distribution</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading allocation data...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            {error}
          </div>
        ) : allocationData.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No allocation data available
          </div>
        ) : (
          <div className="space-y-4">
            {allocationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
