"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvoiceGenerator } from '@/components/invoice-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { DollarSign, FileText, TrendingUp, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Payment = {
  id: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  amount: number;
  mpesaCode: string | null;
  status: string;
  confirmedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type Job = {
  id: number;
  title: string;
  workType: string;
  amount: number;
  status: string;
};

type Transaction = {
  payment: Payment;
  job: Job;
};

type PayoutRequest = {
  id: number;
  writerId: number;
  amount: number;
  method: string;
  accountDetails: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  transactionReference: string | null;
};

export default function FreelancerFinancialOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [completedOrdersData, setCompletedOrdersData] = useState<{
    completedOrdersBalance: number;
    completedOrdersCount: number;
    averageOrderValue: number;
  } | null>(null);
  
  // Payout request state
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else {
        fetchTransactions();
        fetchCompletedOrdersBalance();
        fetchPayoutRequests();
      }
    }
  }, [user, loading, router]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/payments?freelancerId=${user.id}`);
      if (response.ok) {
        const payments = await response.json();
        
        // Fetch job details for each payment
        const transactionsData = await Promise.all(
          payments.map(async (payment: Payment) => {
            const jobResponse = await fetch(`/api/jobs/${payment.jobId}`);
            const job = jobResponse.ok ? await jobResponse.json() : null;
            return { payment, job };
          })
        );
        
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchCompletedOrdersBalance = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/freelancer/completed-orders-balance?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setCompletedOrdersData(data);
      }
    } catch (error) {
      console.error('Failed to fetch completed orders balance:', error);
    }
  };

  const fetchPayoutRequests = async () => {
    if (!user) return;
    
    setLoadingPayouts(true);
    try {
      const response = await fetch(`/api/v2/users/${user.id}/payout-request`);
      if (response.ok) {
        const data = await response.json();
        setPayoutRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch payout requests:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleRequestPayment = () => {
    setShowPayoutDialog(true);
  };

  const handleSubmitPayout = async () => {
    if (!user) return;

    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const availableBalance = completedOrdersData?.completedOrdersBalance ?? 0;
    if (amount > availableBalance) {
      toast.error(`Amount exceeds available balance (KSh ${availableBalance.toFixed(2)})`);
      return;
    }

    let accountDetails: any = {};
    
    if (payoutMethod === 'mpesa') {
      if (!phoneNumber) {
        toast.error('Please enter M-PESA phone number');
        return;
      }
      accountDetails = { phoneNumber };
    } else {
      if (!bankName || !accountNumber || !accountName) {
        toast.error('Please fill in all bank details');
        return;
      }
      accountDetails = { bankName, accountNumber, accountName };
    }

    setSubmittingPayout(true);
    try {
      const response = await fetch(`/api/v2/users/${user.id}/payout-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: payoutMethod,
          accountDetails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Payout request submitted successfully!');
        setShowPayoutDialog(false);
        setPayoutAmount('');
        setPhoneNumber('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        fetchPayoutRequests();
        fetchCompletedOrdersBalance();
      } else {
        toast.error(data.error || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error submitting payout:', error);
      toast.error('Failed to submit payout request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const unrequestedPayments = transactions.filter(
    t => t.payment.status === 'pending' && !t.payment.mpesaCode
  );
  
  const paymentRequests = transactions.filter(
    t => t.payment.status === 'pending' && t.payment.mpesaCode
  );
  
  const paymentHistory = transactions.filter(
    t => t.payment.status === 'confirmed'
  );

  const filteredTransactions = (list: Transaction[]) => {
    if (!searchTerm) return list;
    return list.filter(t => 
      t.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payment.id.toString().includes(searchTerm) ||
      t.job?.id.toString().includes(searchTerm)
    );
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'processed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 md:p-4 lg:p-5">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Overview</h1>
            <p className="text-muted-foreground">
              Track your earnings, payments, and financial transactions
            </p>
          </div>
          <Button onClick={handleRequestPayment} size="lg" className="rounded-xl">
            Request Payout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {(completedOrdersData?.completedOrdersBalance ?? user.balance ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {completedOrdersData?.completedOrdersBalance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {completedOrdersData?.completedOrdersCount || 0} completed orders
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {unrequestedPayments.reduce((sum, t) => sum + t.payment.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unrequestedPayments.length} unrequested
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {completedOrdersData?.averageOrderValue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Tabs */}
      <Tabs defaultValue="payout-requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 rounded-xl">
          <TabsTrigger value="payout-requests" className="rounded-xl">
            Payout Requests
            {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-xl">
                {payoutRequests.filter(p => p.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unrequested" className="rounded-xl">
            Unrequested
            {unrequestedPayments.length > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-xl">{unrequestedPayments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-xl">
            Payment Requests
            {paymentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-xl">{paymentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl">
            Payment History
          </TabsTrigger>
          <TabsTrigger value="fines" className="rounded-xl">
            Fines
          </TabsTrigger>
        </TabsList>

        {/* Search Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by order ID, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <TabsContent value="payout-requests">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Method</th>
                      <th className="text-left py-3 px-4">Account Details</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPayouts ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No payout requests yet
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((payout) => {
                        const details = JSON.parse(payout.accountDetails);
                        return (
                          <tr key={payout.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              {format(new Date(payout.requestedAt), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="py-3 px-4 capitalize">{payout.method}</td>
                            <td className="py-3 px-4">
                              {payout.method === 'mpesa' 
                                ? details.phoneNumber 
                                : `${details.bankName} - ${details.accountNumber}`}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600">
                              KSh {payout.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {getPayoutStatusBadge(payout.status)}
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                              {payout.transactionReference || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unrequested">
          <Card>
            <CardHeader>
              <CardTitle>Unrequested Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Order</th>
                      <th className="text-left py-3 px-4">Transaction Type</th>
                      <th className="text-left py-3 px-4">Comments</th>
                      <th className="text-right py-3 px-4">Value</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTransactions ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredTransactions(unrequestedPayments).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No unrequested payments
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions(unrequestedPayments).map(({ payment, job }) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <a href={`#${payment.jobId}`} className="text-blue-500 hover:underline">
                              #{payment.jobId}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                              Order Completed (0 pages)
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize">{job?.workType || '-'}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            KES {payment.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPaymentId(payment.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Payment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Order</th>
                      <th className="text-left py-3 px-4">Transaction Type</th>
                      <th className="text-left py-3 px-4">Comments</th>
                      <th className="text-right py-3 px-4">Value</th>
                      <th className="text-right py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTransactions ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredTransactions(paymentRequests).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No payment requests
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions(paymentRequests).map(({ payment, job }) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <a href={`#${payment.jobId}`} className="text-blue-500 hover:underline">
                              #{payment.jobId}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                              Payment Requested
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize">{job?.workType || '-'}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            KES {payment.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="secondary">Pending</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Order</th>
                      <th className="text-left py-3 px-4">Transaction Type</th>
                      <th className="text-left py-3 px-4">Comments</th>
                      <th className="text-right py-3 px-4">Value</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTransactions ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredTransactions(paymentHistory).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No payment history
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions(paymentHistory).map(({ payment, job }) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {format(new Date(payment.updatedAt), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="py-3 px-4">
                            <a href={`#${payment.jobId}`} className="text-blue-500 hover:underline">
                              #{payment.jobId}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                              Payment Confirmed
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize">{job?.workType || '-'}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            KES {payment.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPaymentId(payment.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines">
          <Card>
            <CardHeader>
              <CardTitle>Fines & Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                No fines or deductions recorded
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold text-green-600">
                KSh {(completedOrdersData?.completedOrdersBalance ?? 0).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payout Amount (KSh)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={completedOrdersData?.completedOrdersBalance ?? 0}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={payoutMethod} onValueChange={(v: 'mpesa' | 'bank') => setPayoutMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-PESA</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutMethod === 'mpesa' ? (
              <div className="space-y-2">
                <Label htmlFor="phone">M-PESA Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254712345678"
                  className="rounded-xl"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Equity Bank"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter account holder name"
                    className="rounded-xl"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)} disabled={submittingPayout} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSubmitPayout} disabled={submittingPayout} className="rounded-xl">
              {submittingPayout ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Generator Dialog */}
      {selectedPaymentId && (
        <InvoiceGenerator
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
        />
      )}
    </div>
  );
}