"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export type ExportOrdersCSVButtonProps = {
  managerId: number;
  status?: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "icon" | null;
};

export const ExportOrdersCSVButton = ({ managerId, status, label = "Export CSV", size = "sm" }: ExportOrdersCSVButtonProps) => {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const params = new URLSearchParams({ managerId: String(managerId), format: "csv" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/manager/orders?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fname = `manager-orders-${managerId}-${status ?? "all"}-${new Date().toISOString().slice(0,10)}.csv`;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button size={size ?? undefined} onClick={handleExport} disabled={downloading} className="shrink-0">
      <Download className="w-4 h-4 mr-2" /> {downloading ? "Preparing..." : label}
    </Button>
  );
};
