import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { usePermissions } from '../hooks/usePermissions';

export default function Payments() {
  const { can } = usePermissions();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(
            id,
            order_total,
            customer:users!customer_id(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch payments');
      }
      
      setPayments(data || []);
      
    } catch (err) {
      console.error('❌ Payments loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  if (!can('view_payments')) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CreditCard className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Payments Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPayments}>
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredPayments = statusFilter === 'all'
    ? payments
    : payments.filter(payment => payment.status === statusFilter);

  const statusColors = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'info',
  } as const;

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    failed: XCircle,
    refunded: RefreshCw,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Monitor payment transactions and status ({payments.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadPayments} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setFiltering(true);
              setStatusFilter(e.target.value);
              setTimeout(() => setFiltering(false), 100);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Payments ({payments.length})</option>
            <option value="pending">Pending ({payments.filter(p => p.status === 'pending').length})</option>
            <option value="paid">Paid ({payments.filter(p => p.status === 'paid').length})</option>
            <option value="failed">Failed ({payments.filter(p => p.status === 'failed').length})</option>
            <option value="refunded">Refunded ({payments.filter(p => p.status === 'refunded').length})</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{payments
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                    .toLocaleString()
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'paid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Payments Found</CardTitle>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'No payment transactions yet.' 
                : `No payments with status "${statusFilter}" found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const StatusIcon = statusIcons[payment.status] || Clock;
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {payment.transaction_id || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          #{payment.id.slice(-8)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.order?.customer?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.order?.customer?.email || 'No email'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">
                        #{payment.order?.id?.slice(-8) || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">
                        ₹{Number(payment.amount || 0).toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {payment.provider || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}