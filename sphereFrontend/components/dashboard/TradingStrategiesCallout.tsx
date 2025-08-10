import React from 'react';
import Link from 'next/link';
import { Briefcase, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const TradingStrategiesCallout: React.FC = () => {
  return (
    <div className="mb-10">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-blue-500/10 hover:shadow-xl transition-all duration-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
        
        <CardContent className="relative p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Strategies</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">Build your automated edge</p>
                </div>
              </div>
              
              <p className="text-muted-foreground text-lg max-w-2xl">
                Create, backtest, and deploy sophisticated trading strategies with our no-code platform. 
                Turn market insights into automated profits.
              </p>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Automated execution</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Real-time backtesting</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-emerald-200 transition-all duration-300 group/btn">
                <Link href="/strategies">
                  <Briefcase className="mr-2 h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                  View All Strategies
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200">
                <Link href="/strategies/new">
                  Create Strategy
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};