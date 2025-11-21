"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string; // when provided, renders as Link
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}) => {
  const ActionContent = actionLabel ? <span>{actionLabel}</span> : null;
  return (
    <div className="text-center border border-border rounded-xl p-10 bg-card">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
        {icon || <span className="block w-3 h-3 rounded-full bg-primary" />}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      ) : null}
      {actionLabel ? (
        actionHref ? (
          <Button asChild className="btn btn-primary">
            <Link href={actionHref}>{ActionContent}</Link>
          </Button>
        ) : (
          <Button onClick={onAction} className="btn btn-primary">{ActionContent}</Button>
        )
      ) : null}
    </div>
  );
};
