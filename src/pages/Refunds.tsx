import React, { useEffect, useState } from 'react';
import { RefreshCw, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { usePermissions } from '../hooks/usePermissions';

export default function Refunds() {
  const { can } = usePermissions();

  if (!can('manage_refunds')) {
    return null;
  }
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          order:orders(
            id,
            order_total,
            customer:users!customer_id(full_name, email)
          ),
          payment:payments(id, transaction_id, provider)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch refunds');
      }
      
      setRefunds(data || []);
      
    } catch (err) {
      console.error('❌ Refunds loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = statusFilter === 'all' 
    ? refunds 
    : refunds.filter(refund => refund.status === statusFilter);

  const statusColors = {
    initiated: 'warning',
    completed: 'success',
    failed: 'error',
  } as const;

  const statusIcons = {
    initiated: Clock,
    completed: CheckCircle,
    failed: XCircle,
  };

  const typeColors = {
    full: 'info',
    partial: 'warning',
  } as const;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading refunds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Refunds Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadRefunds}>
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refunds</h1>
          <p className="text-gray-600">Monitor refund requests and processing ({refunds.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadRefunds} disabled={loading} icon={RefreshCw}>
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
            <option value="all">All Refunds ({refunds.length})</option>
            <option value="initiated">Initiated ({refunds.filter(r => r.status === 'initiated').length})</option>
            <option value="completed">Completed ({refunds.filter(r => r.status === 'completed').length})</option>
            <option value="failed">Failed ({refunds.filter(r => r.status === 'failed').length})</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Refunded</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{refunds
                    .filter(r => r.status === 'completed')
                    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {refunds.filter(r => r.status === 'completed').length}
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
                  {refunds.filter(r => r.status === 'initiated').length}
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
                  {refunds.filter(r => r.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      {filteredRefunds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Refunds Found</CardTitle>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'No refund requests yet.' 
                : `No refunds with status "${statusFilter}" found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map((refund) => {
                const StatusIcon = statusIcons[refund.status] || Clock;
                
                return (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">
                        #{refund.id.slice(-8)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {refund.order?.customer?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {refund.order?.customer?.email || 'No email'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">
                        #{refund.order?.id?.slice(-8) || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">
                        ₹{Number(refund.amount || 0).toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      {refund.type && (
                        <Badge variant={typeColors[refund.type]}>
                          {refund.type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {refund.reason || 'No reason provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={statusColors[refund.status]}>
                          {refund.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(refund.created_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(refund.created_at), 'HH:mm')}
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