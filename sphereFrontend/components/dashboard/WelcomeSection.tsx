import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

interface WelcomeSectionProps {
  userName: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{currentDate}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-white dark:to-gray-200 bg-clip-text text-transparent">
            Welcome back, {userName}
          </h1>
          <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl">
            Your portfolio is performing well today. Here's an overview of your investments and trading strategies.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Markets are active
          </span>
        </div>
      </div>
    </div>
  );
};