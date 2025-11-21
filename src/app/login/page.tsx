"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await apiPost<any>('/api/auth/login', {
        email,
        password,
        rememberMe
      });

      // Store user data immediately
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('bearer_token', String(userData.id));

      toast.success('Login successful! Redirecting...');
      
      // Compute dashboard path per role - use replace to prevent back button issues
      const dashboardPath = userData.role === 'admin'
        ? '/admin/dashboard'
        : userData.role === 'manager'
        ? '/manager/dashboard'
        : userData.role === 'client' || userData.role === 'account_owner'
        ? '/client/dashboard'
        : userData.role === 'freelancer'
        ? '/freelancer/dashboard'
        : '/';

      // Use setTimeout to ensure localStorage is written before navigation
      setTimeout(() => {
        window.location.href = dashboardPath; // Direct navigation for fastest loading
      }, 100);
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid email or password';
      
      if (errorMessage.includes('rejected')) {
        toast.error('Your account has been rejected. Please contact support.');
      } else if (errorMessage.includes('blacklisted')) {
        toast.error('Your account has been blacklisted. Please contact support.');
      } else if (errorMessage.includes('suspended')) {
        toast.error('Your account is suspended. Please contact support.');
      } else if (errorMessage.includes('locked')) {
        toast.error(errorMessage);
      } else if (errorMessage.includes('pending') || errorMessage.includes('approval')) {
        toast.error('Your account is pending approval. You can browse your dashboard but actions are disabled.');
      } else {
        toast.error('Invalid email or password. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      {/* Simple gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 flex items-center justify-center min-h-screen py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-primary">TaskLynk</h1>
            <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rememberMe" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                />
                <label 
                  htmlFor="rememberMe" 
                  className="text-sm text-foreground/90 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create account
              </Link>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              New accounts require admin approval before access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}