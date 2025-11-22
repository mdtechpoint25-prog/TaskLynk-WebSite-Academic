"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Eye, Receipt } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  actualDeadline: string;
  createdAt: string;
  acceptedAt?: string;
  approvedByClientAt?: string;
  updatedAt?: string;
  writer?: { id: number; displayId: string; name: string } | null;
};

export default function ClientAcceptedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?status=accepted&clientId=${user?.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== "client" && user.role !== "account_owner")) {
        router.push("/");
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router, fetchJobs]);

  const handlePayNow = useCallback(async (jobId: number) => {
    try {
      setPaying(jobId);
      // Initiate payment - this would typically open M-Pesa payment dialog
      router.push(`/client/jobs/${jobId}?action=pay`);
    } catch (e) {
      toast.error("Payment initiation failed");
    } finally {
      setPaying(null);
    }
  }, [router]);

  const jobRows = useMemo(() => jobs.map((job) => (
    <TableRow 
      key={job.id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push(`/client/jobs/${job.id}`)}
    >
      <TableCell className="font-mono text-xs">
        <Badge variant="outline">{job.displayId}</Badge>
      </TableCell>
      <TableCell className="font-medium">{job.title}</TableCell>
      <TableCell>{job.writer?.name || "Unassigned"}</TableCell>
      <TableCell className="font-semibold">KSh {job.amount.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {format(new Date(job.acceptedAt || job.approvedByClientAt || job.updatedAt || job.createdAt), "MMM dd, yyyy")}
        </div>
      </TableCell>
      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
        <Link href={`/client/jobs/${job.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
        </Link>
        <Button
          size="sm"
          className="btn btn-primary"
          onClick={() => handlePayNow(job.id)}
          disabled={paying === job.id}
        >
          <Receipt className="w-4 h-4 mr-1" /> {paying === job.id ? "Processing..." : "Pay Now"}
        </Button>
      </TableCell>
    </TableRow>
  )), [jobs, paying, router, handlePayNow]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DashboardNav />
      <div className="flex min-h-screen bg-background">
        <ClientSidebar />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-cyan-600" /> Accepted Orders
              </h1>
              <p className="text-muted-foreground">Orders you have accepted after delivery. Proceed with payment to download the files.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Accepted Orders ({jobs.length})</CardTitle>
                <CardDescription>Review and pay for accepted orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No accepted orders</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Writer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Accepted Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobRows}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
