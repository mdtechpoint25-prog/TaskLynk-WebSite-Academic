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
import { Receipt, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
  paymentConfirmed: boolean;
  clientName?: string;
};

export default function AdminPaidOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

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
      // Fetch completed orders and filter for payment confirmed
      const res = await fetch(`/api/jobs?status=completed&_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Filter to only show orders where payment has been confirmed by admin
        const paidOrders = data.filter((job: Job) => job.paymentConfirmed === true);
        setJobs(paidOrders);
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
              <Receipt className="w-6 h-6 text-emerald-600" /> Paid Orders
            </h1>
            <p className="text-muted-foreground">All orders with confirmed client payments.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Paid Orders ({jobs.length})</CardTitle>
              <CardDescription>Fully paid and finalized orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No paid orders</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">
                          <Link href={`/admin/jobs/${job.id}`} className="text-primary hover:underline">
                            {job.displayId}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.clientName || "Client"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{job.workType}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">KSh {job.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(job.createdAt), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/jobs/${job.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                          </Link>
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