"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Bell, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  LogOut,
  Star,
  ChevronDown,
  DollarSign,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { apiGet, handleApiError } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-constants';
import { SkeletonAvatar, SkeletonLine } from '@/components/ui/skeleton-loaders';

interface UserBadge {
  id: number;
  badgeName: string;
  badgeIcon: string;
  description?: string;
  color?: string;
}

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  displayId: string;
  avatar?: string | null;
  rating?: number;
  ratingAverage?: number;
  ratingCount?: number;
  balance?: number;
  totalEarned?: number;
  completedJobs?: number;
  badges?: UserBadge[];
}

interface UserProfilePanelProps {
  userId: number;
}

export function UserProfilePanel({ userId }: UserProfilePanelProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const data = await apiGet<UserProfileData>(API_ENDPOINTS.USER_PROFILE(String(userId)));
      setUser(data);

      const badgesData = await apiGet<{ badges: UserBadge[] }>(API_ENDPOINTS.USERS_BADGES(userId));
      setBadges(badgesData.badges || []);
    } catch (error) {
      handleApiError(error, 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiGet<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT(String(userId)));
      setNotificationCount(data.count || 0);
    } catch (error) {
      handleApiError(error, 'Failed to load notifications');
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiGet<{ unreadCount: number }>(API_ENDPOINTS.NOTIFICATIONS_MESSAGE_COUNTS(String(userId)));
      setMessageCount(data.unreadCount || 0);
    } catch (error) {
      handleApiError(error, 'Failed to load messages');
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userSession');
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center gap-4">
        <SkeletonAvatar size={40} />
        <div className="space-y-2">
          <SkeletonLine width="w-32" />
          <SkeletonLine width="w-20" />
        </div>
      </div>
    );
  }

  const showRatings = user.role === 'freelancer' || user.role === 'client';
  const showPayments = user.role === 'freelancer' || user.role === 'client' || user.role === 'manager';
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  const displayRating = user.ratingAverage || user.rating || 0;
  const ratingCount = user.ratingCount || 0;

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Notifications Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push('/notifications')}
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Button>

      {/* Messages */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push(`/${user.role}/messages`)}
      >
        <MessageSquare className="h-5 w-5" />
        {messageCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            {messageCount > 9 ? '9+' : messageCount}
          </span>
        )}
      </Button>

      {/* Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {user.displayId}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          {/* Rating Bar (Writers & Clients only) */}
          {showRatings && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold">{displayRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({ratingCount})</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${(displayRating / 5) * 100}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Badges (Writers & Clients only) */}
          {showRatings && badges.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-3">
                <p className="text-sm font-medium mb-2">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 4).map((badge) => (
                    <Badge
                      key={badge.id}
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: badge.color || '#FFC107' }}
                      title={badge.description || badge.badgeName}
                    >
                      <span className="mr-1">{badge.badgeIcon}</span>
                      {badge.badgeName}
                    </Badge>
                  ))}
                  {badges.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{badges.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Balance (Writers, Clients, Managers) */}
          {showPayments && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance</span>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>KSh {(user.balance || 0).toLocaleString()}</span>
                  </div>
                </div>
                {user.totalEarned !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Earned: KSh {(user.totalEarned || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Completed Jobs (Writers) */}
          {(user.role === 'freelancer') && user.completedJobs !== undefined && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed Orders</span>
                  <div className="flex items-center gap-1 font-bold">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{user.completedJobs}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push(`/${user.role}/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          {showPayments && (
            <DropdownMenuItem onClick={() => router.push(`/${user.role}/financial-overview`)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Settings
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}