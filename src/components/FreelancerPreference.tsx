'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Star, User } from 'lucide-react';
import { toast } from 'sonner';

interface Freelancer {
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  freelancerRating: number | null;
  completedJobs: number;
  avgRating: number | null;
  lastWorkedAt: string;
}

interface FreelancerPreferenceProps {
  clientId: number;
  onSelect: (freelancerId: number | null, preference: 'preferred' | 'any') => void;
  disabled?: boolean;
}

export function FreelancerPreference({ clientId, onSelect, disabled = false }: FreelancerPreferenceProps) {
  const [previousFreelancers, setPreviousFreelancers] = useState<Freelancer[]>([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<number | null>(null);
  const [preference, setPreference] = useState<'preferred' | 'any'>('any');
  const [showPreviousOnly, setShowPreviousOnly] = useState(false);

  useEffect(() => {
    const fetchPreviousFreelancers = async () => {
      if (!clientId) return;

      setLoadingFreelancers(true);
      try {
        const response = await fetch(`/api/v2/freelancers/previous?clientId=${clientId}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setPreviousFreelancers(data.freelancers || []);
        }
      } catch (error) {
        console.error('Failed to fetch previous freelancers:', error);
      } finally {
        setLoadingFreelancers(false);
      }
    };

    fetchPreviousFreelancers();
  }, [clientId]);

  const handlePreferenceChange = (pref: 'preferred' | 'any') => {
    setPreference(pref);
    if (pref === 'any') {
      setSelectedFreelancer(null);
      setShowPreviousOnly(false);
    }
    onSelect(pref === 'any' ? null : selectedFreelancer, pref);
  };

  const handleFreelancerSelect = (freelancerId: number) => {
    setSelectedFreelancer(freelancerId);
    setPreference('preferred');
    setShowPreviousOnly(true);
    onSelect(freelancerId, 'preferred');
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Freelancer Preference
        </CardTitle>
        <CardDescription>
          Choose a freelancer from your previous orders or let us find the best available writer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={preference}
          onValueChange={(val) => handlePreferenceChange(val as 'preferred' | 'any')}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-blue-100/50 dark:hover:bg-blue-900/30 cursor-pointer">
            <RadioGroupItem value="any" id="any-writer" />
            <Label htmlFor="any-writer" className="flex-1 cursor-pointer font-medium">
              Any Available Writer
            </Label>
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Faster Matching
            </Badge>
          </div>

          {previousFreelancers.length > 0 && (
            <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-blue-100/50 dark:hover:bg-blue-900/30">
              <RadioGroupItem value="preferred" id="preferred-writer" />
              <Label htmlFor="preferred-writer" className="flex-1 cursor-pointer font-medium">
                Select from Previous Writers
              </Label>
            </div>
          )}
        </RadioGroup>

        {/* Previous Freelancers List */}
        {previousFreelancers.length > 0 && preference === 'preferred' && (
          <div className="mt-4 space-y-3">
            <Alert>
              <AlertDescription className="text-xs">
                {previousFreelancers.length} writer(s) have successfully completed work for you before
              </AlertDescription>
            </Alert>

            {loadingFreelancers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {previousFreelancers.map((freelancer) => (
                  <div
                    key={freelancer.freelancerId}
                    onClick={() => handleFreelancerSelect(freelancer.freelancerId)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFreelancer === freelancer.freelancerId
                        ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600'
                        : 'bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{freelancer.freelancerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{freelancer.freelancerEmail}</p>
                      </div>
                      {freelancer.avgRating && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">{freelancer.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {freelancer.completedJobs} job{freelancer.completedJobs !== 1 ? 's' : ''}
                      </Badge>
                      {freelancer.lastWorkedAt && (
                        <Badge variant="outline" className="text-xs">
                          Last: {new Date(freelancer.lastWorkedAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {previousFreelancers.length === 0 && (
          <Alert>
            <AlertDescription className="text-xs">
              You don't have any previous writers yet. This is your first order! We'll match you with a great writer.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
