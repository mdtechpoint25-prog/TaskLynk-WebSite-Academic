'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface CPPLevelInfo {
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  progressBarColor: string;
}

interface CPPApprovalNotificationProps {
  cppLevels?: CPPLevelInfo[];
  isApproved?: boolean;
}

export default function CPPApprovalNotification({
  cppLevels = [],
  isApproved = false,
}: CPPApprovalNotificationProps) {
  if (cppLevels.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900 mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Earnings Tier System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Welcome! As a freelancer on TaskLynk, you'll progress through earning tiers based on completed orders. 
          Each tier unlocks higher Content Production Payment (CPP) rates for your work.
        </p>

        {/* Tier Progression Display */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Your Earning Tiers
          </p>
          
          <div className="grid gap-3">
            {cppLevels.map((level) => (
              <div
                key={level.level}
                className="p-3 rounded-lg border-l-4 bg-white dark:bg-slate-800/50 shadow-sm"
                style={{ borderColor: level.progressBarColor }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-xs" style={{ backgroundColor: level.progressBarColor }}>
                        Tier {level.level}
                      </Badge>
                      <p className="font-bold text-sm">{level.levelName}</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{level.description}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                    <p className="font-bold text-sm">{level.completedOrdersRequired} orders</p>
                  </div>
                </div>

                {/* CPP Rates */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs">
                    <p className="text-gray-600 dark:text-gray-400">Non-Technical</p>
                    <p className="font-bold text-green-600">KSh {level.cppNonTechnical}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-600 dark:text-gray-400">Technical</p>
                    <p className="font-bold text-green-600">KSh {level.cppTechnical}</p>
                    <p className="text-gray-500 dark:text-gray-500 text-[10px]">(+20 bonus)</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">How It Works</p>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>✓ Start at <strong>Starter Tier</strong> with KSh 150 (non-technical) base rate</li>
            <li>✓ Complete orders to progress through tiers and unlock higher rates</li>
            <li>✓ Technical work earns +KSh 20 bonus on top of each tier's rate</li>
            <li>✓ Master Tier is the highest level with KSh 200+ base rates</li>
            <li>✓ Progress bar shows your advancement in current tier</li>
          </ul>
        </div>

        {/* Example Path */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">📈 Example Progression</p>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            You complete 3 orders → Promoted to <strong>Rising Tier</strong> (KSh 160) → 
            Complete 5 more → <strong>Established Tier</strong> (KSh 170) → 
            Continue progressing to <strong>Master Tier</strong> (KSh 200)
          </p>
        </div>

        {isApproved && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3">
            <p className="text-xs text-green-800 dark:text-green-200">
              ✅ Your account is approved! Start bidding on jobs and begin climbing the tiers. 
              Your earning potential increases with every completed project.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
