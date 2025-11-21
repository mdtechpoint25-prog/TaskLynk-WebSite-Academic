"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { LeftNav } from "@/components/left-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, CheckCircle, Eye } from "lucide-react";
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
  // optional timestamps that may be present from backend
  updatedAt?: string;
  // ... keep existing client/writer types
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
};

export default function AdminApprovedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        router.push("/");
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/jobs?status=approved&_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  };

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
      <LeftNav role="admin" userName={user.name} userRole={user.role} />
      <div className="min-h-screen bg-background ml-64">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BadgeCheck className="w-6 h-6 text-cyan-600" /> Admin Approved Orders
            </h1>
            <p className="text-muted-foreground">Orders approved by admin and ready for freelancer bidding/assignment.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Approved Orders ({jobs.length})</CardTitle>
              <CardDescription>These orders are ready to be assigned to writers. Payments are not handled here.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No admin-approved orders</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Writer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Admin Approved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow 
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          <Badge variant="outline">{job.displayId}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.client?.name || "Unknown"}</TableCell>
                        <TableCell>{job.writer?.name || "Unassigned"}</TableCell>
                        <TableCell className="font-semibold">KSh {job.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3" /> {format(new Date(job.updatedAt || job.createdAt), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/admin/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                          </Link>
                          {/* No Confirm Payment button on Admin Approved list */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}