import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/apiClient';

interface TrendingStrategy {
  name: string;
  performance: string;
  users: number;
}

export const DiscoverSection: React.FC = () => {
  const [trendingStrategies, setTrendingStrategies] = useState<TrendingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStrategies = async () => {
      try {
        const response = await apiClient.get('/strategies/trending');
        setTrendingStrategies(response.data);
      } catch (err) {
        console.error('Failed to fetch trending strategies:', err);
        setError('Failed to load trending strategies');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingStrategies();
  }, []);
  return (
    <div className="mt-10"> {/* Add margin-top */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Discover</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/discover">
            Explore More
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trending Strategies Card */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Strategies</CardTitle>
            <CardDescription>Popular strategies among users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading trending strategies...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-500">
                {error}
              </div>
            ) : trendingStrategies.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No trending strategies available
              </div>
            ) : (
              <div className="space-y-4">
                {trendingStrategies.map((strategy, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{strategy.name}</div>
                      <div className="text-sm text-muted-foreground">{strategy.users} users</div>
                    </div>
                    <div className="text-green-500 font-medium">{strategy.performance}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/discover/strategies">View All Strategies</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Market Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>Latest trends and opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">AI Sector Outperformance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI-related stocks continue to outperform the broader market, with significant momentum.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center mb-2">
                  <Zap className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Interest Rate Outlook</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analysts expect rates to remain stable in the near term, supporting growth stocks.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/discover/insights">More Insights</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};