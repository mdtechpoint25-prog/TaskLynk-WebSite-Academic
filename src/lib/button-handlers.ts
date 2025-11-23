"use client";

import React from 'react';
import { toast } from 'sonner';

interface HandleButtonOptions {
  label: string;
  onSuccess?: (result?: any) => void | Promise<void>;
  onError?: (error: Error) => void;
  showSuccess?: boolean;
  showError?: boolean;
  preventDefault?: boolean;
}

/**
 * Wraps async button handlers with proper error handling and loading states
 * Usage: await handleButtonAction(async () => { ... }, { label: "Create", onSuccess: ... })
 */
export async function handleButtonAction(
  action: () => Promise<any>,
  options: HandleButtonOptions
): Promise<boolean> {
  const {
    label,
    onSuccess,
    onError,
    showSuccess = true,
    showError = true,
    preventDefault = true,
  } = options;

  try {
    const result = await action();

    if (showSuccess) {
      toast.success(`${label} successful!`);
    }

    await onSuccess?.(result);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (showError) {
      toast.error(err.message || `${label} failed`);
    }

    onError?.(err);
    return false;
  }
}

/**
 * Safe wrapper for navigation and links
 */
export function createSafeNavigation(callback: () => void) {
  return (e?: React.MouseEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    try {
      callback();
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed');
    }
  };
}

/**
 * Safe wrapper for form submissions
 */
export function createFormSubmitHandler(
  onSubmit: (data: FormData) => Promise<void>,
  options: { label?: string; showSuccess?: boolean } = {}
) {
  return async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await onSubmit(formData);
      if (options.showSuccess !== false) {
        toast.success(options.label ? `${options.label} submitted` : 'Submitted successfully');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || 'Submission failed');
    }
  };
}
