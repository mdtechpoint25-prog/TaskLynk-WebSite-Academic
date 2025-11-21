"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, Search, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  message: string;
  bidAmount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

function FreelancerBidsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);

  // Filters
  // Force only pending to comply with "no bid history" requirement
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "freelancer") {
        router.push("/");
      } else if (!user.approved) {
        router.push("/freelancer/dashboard");
      } else {
        fetchBids();
        const interval = setInterval(fetchBids, 10000);
        return () => clearInterval(interval);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchBids = async () => {
    if (!user) return;
    setLoadingBids(true);
    try {
      // Always request only pending bids to avoid showing history
      const url = `/api/bids?freelancerId=${user.id}&status=pending`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Safety: keep only pending in case backend returns more
        setBids(Array.isArray(data) ? data.filter((b: Bid) => b.status === "pending") : []);
      }
    } catch (e) {
      console.error("Failed to load bids", e);
    } finally {
      setLoadingBids(false);
    }
  };

  // Re-fetch when status filter changes (kept for compatibility, but we still enforce pending)
  useEffect(() => {
    if (user && user.role === "freelancer" && user.approved) {
      fetchBids();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredBids = useMemo(() => {
    const source = bids; // already pending only
    if (!query) return source;
    const q = query.toLowerCase();
    return source.filter((b) => (b.message || "").toLowerCase().includes(q));
  }, [bids, query]);

  const pendingCount = useMemo(() => bids.length, [bids]);
  const acceptedCount = 0;
  const rejectedCount = 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold mb-2">My Bids</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Only pending bids are shown. When a bid is accepted, the job moves to In Progress. If another writer is assigned, your bid disappears.</p>
      </div>

      {/* Bid Status Info Alert */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs sm:text-sm">
          <strong>No bid history:</strong> Pending only. Accepted work appears under My Jobs. Rejected/assigned-elsewhere bids are removed.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Moves to My Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Hidden by policy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending only</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar (status locked to pending) */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter("pending") /* lock to pending */}>
                <SelectTrigger>
                  <SelectValue placeholder="Pending" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-7">
              <label className="text-xs text-muted-foreground mb-1 block">Search message</label>
              <Input placeholder="Search within your bid message" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <Button type="button" className="gap-2" onClick={fetchBids}><Search className="h-4 w-4" /> Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loadingBids ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredBids.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No pending bids</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-xs">Bid</TableHead>
                <TableHead className="text-xs">Job</TableHead>
                <TableHead className="text-right text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="hidden md:table-cell text-xs">Message</TableHead>
                <TableHead className="hidden lg:table-cell text-xs">Created</TableHead>
                <TableHead className="text-right text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs sm:text-sm text-primary font-semibold">#{b.id}</TableCell>
                  <TableCell>
                    <span className="block text-xs sm:text-sm font-medium">Job #{b.jobId}</span>
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-semibold text-xs sm:text-sm">KSh {Number(b.bidAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs px-2 py-0.5">{b.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[360px] truncate text-muted-foreground text-xs">{b.message || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">{format(new Date(b.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/freelancer/orders/${b.jobId}`} className="text-primary hover:underline font-medium text-xs sm:text-sm">
                      View Order
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function FreelancerBidsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <FreelancerBidsContent />
    </Suspense>
  );
}