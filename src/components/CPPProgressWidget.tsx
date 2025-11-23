'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Target, Award, Zap } from 'lucide-react';

interface CPPLevel {
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  progressBarColor: string;
}

interface CPPStatus {
  currentLevel: number;
  totalCompletedOrders: number;
  ordersInCurrentLevel: number;
  progressPercentage: number;
  nextLevelOrdersRequired: number;
  currentCPP: number;
  nextLevelCPP: number;
  isWorkTypeSpecialized: boolean;
}

interface CPPProgressData {
  freelancer: { id: number; name: string };
  cppStatus: CPPStatus;
  cppLevels: CPPLevel[];
  currentLevelDetails: CPPLevel | null;
  nextLevelDetails: CPPLevel | null;
}

interface CPPProgressProps {
  freelancerId: number;
}

export default function CPPProgressWidget({ freelancerId }: CPPProgressProps) {
  const [data, setData] = useState<CPPProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPPData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v2/freelancers/cpp?freelancerId=${freelancerId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch CPP data');
        }

        const cppData = await response.json();
        setData(cppData);
      } catch (err) {
        console.error('Error fetching CPP data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load CPP information');
      } finally {
        setLoading(false);
      }
    };

    fetchCPPData();
  }, [freelancerId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Earnings Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-8 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <Zap className="h-5 w-5" />
            Earnings Tier Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-300 bg-red-100 dark:bg-red-900/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error || 'Unable to load tier information'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { cppStatus, currentLevelDetails, nextLevelDetails, cppLevels } = data;
  const isMaxLevel = cppStatus.nextLevelOrdersRequired === 0;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Earnings Tier Progress
          </CardTitle>
          <Badge className="bg-blue-600 text-white">{cppStatus.currentLevel} of {cppLevels.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                {currentLevelDetails?.levelName || 'Starter'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentLevelDetails?.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                KSh {cppStatus.currentCPP}
              </p>
              <p className="text-xs text-gray-500">Current Rate</p>
            </div>
          </div>

          {/* CPP Rate Breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900/50">
              <p className="text-xs text-gray-600 dark:text-gray-400">Non-Technical</p>
              <p className="font-bold text-sm">KSh {currentLevelDetails?.cppNonTechnical}</p>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900/50">
              <p className="text-xs text-gray-600 dark:text-gray-400">Technical (+20)</p>
              <p className="font-bold text-sm">KSh {currentLevelDetails?.cppTechnical}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!isMaxLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Progress to {nextLevelDetails?.levelName}</p>
              <span className="text-xs font-mono text-gray-500">
                {cppStatus.ordersInCurrentLevel} / {cppStatus.ordersInCurrentLevel + cppStatus.nextLevelOrdersRequired}
              </span>
            </div>
            
            {/* Progress Bar with Gradient */}
            <div className="w-full h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              <div
                className={`h-full transition-all duration-500 flex items-center justify-end pr-2`}
                style={{
                  width: `${cppStatus.progressPercentage}%`,
                  backgroundColor: currentLevelDetails?.progressBarColor || '#10b981',
                }}
              >
                {cppStatus.progressPercentage > 15 && (
                  <span className="text-xs font-bold text-white drop-shadow">
                    {Math.round(cppStatus.progressPercentage)}%
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {cppStatus.nextLevelOrdersRequired} orders until next tier
            </p>
          </div>
        )}

        {/* Master Tier Message */}
        {isMaxLevel && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <Award className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 ml-2">
              🏆 You've reached Master tier! Enjoy CPP {cppStatus.currentCPP} for all your work.
            </AlertDescription>
          </Alert>
        )}

        {/* Next Level Preview */}
        {!isMaxLevel && nextLevelDetails && (
          <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Next Tier Preview
            </p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {nextLevelDetails.levelName}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                {nextLevelDetails.description}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs">
                  <p className="text-indigo-600 dark:text-indigo-400">Non-Tech</p>
                  <p className="font-bold text-indigo-800 dark:text-indigo-200">
                    KSh {nextLevelDetails.cppNonTechnical}
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-indigo-600 dark:text-indigo-400">Technical</p>
                  <p className="font-bold text-indigo-800 dark:text-indigo-200">
                    KSh {nextLevelDetails.cppTechnical}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Levels Reference */}
        <div className="pt-3 border-t">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Tier Progression</p>
          <div className="space-y-1">
            {cppLevels.map((level) => (
              <div
                key={level.level}
                className={`text-xs p-2 rounded flex items-center justify-between ${
                  level.level === cppStatus.currentLevel
                    ? 'bg-white dark:bg-slate-800 border-l-4'
                    : 'bg-gray-50 dark:bg-gray-900/30 opacity-60'
                }`}
                style={level.level === cppStatus.currentLevel ? { borderColor: level.progressBarColor } : {}}
              >
                <div>
                  <span className="font-bold">{level.levelName}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {level.completedOrdersRequired} orders • KSh {level.cppNonTechnical}
                  </span>
                </div>
                {level.level === cppStatus.currentLevel && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Current</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
