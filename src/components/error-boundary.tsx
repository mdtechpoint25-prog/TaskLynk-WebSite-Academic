"use client";
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

/**
 * ErrorBoundary - prevents the entire app from crashing on render errors.
 * Usage:
 * <ErrorBoundary>
 *   <YourTree />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hook up your logging service here
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error", { error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[40vh] w-full flex items-center justify-center px-6">
          <div className="max-w-xl w-full text-center bg-card border border-border rounded-xl p-8">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The page failed to render. You can try again. If the problem persists, please contact support.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundaryCard = ({ title = "Something went wrong", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) => (
  <div className="w-full text-center bg-card border border-border rounded-xl p-8">
    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20">
      <AlertTriangle className="w-6 h-6 text-amber-600" />
    </div>
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    {description ? (
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
    ) : null}
    {onRetry ? (
      <button type="button" onClick={onRetry} className="btn btn-primary inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    ) : null}
  </div>
);
