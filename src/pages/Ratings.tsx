import React, { useEffect, useState } from 'react';
import { Star, RefreshCw, User, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function Ratings() {
  const [orderRatings, setOrderRatings] = useState<any[]>([]);
  const [agentRatings, setAgentRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'agents'>('orders');

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orderRatingsResult, agentRatingsResult] = await Promise.all([
        supabase
          .from('order_ratings')
          .select(`
            *,
            order:orders(
              id,
              order_total,
              customer:users!customer_id(full_name, email)
            ),
            rated_by_user:users!rated_by(full_name, email)
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('agent_ratings')
          .select(`
            *,
            agent:users!agent_id(full_name, email),
            rated_by_user:users!rated_by(full_name, email)
          `)
          .order('created_at', { ascending: false })
      ]);
      
      if (orderRatingsResult.error) {
        throw new Error(orderRatingsResult.error.message || 'Failed to fetch order ratings');
      }
      
      if (agentRatingsResult.error) {
        throw new Error(agentRatingsResult.error.message || 'Failed to fetch agent ratings');
      }
      
      setOrderRatings(orderRatingsResult.data || []);
      setAgentRatings(agentRatingsResult.data || []);
      
    } catch (err) {
      console.error('❌ Ratings loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const getAverageRating = (ratings: any[]) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading ratings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Star className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Ratings Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadRatings}>
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
          <h1 className="text-3xl font-bold text-gray-900">Ratings & Reviews</h1>
          <p className="text-gray-600">Monitor customer feedback and service ratings</p>
        </div>
        
        <Button variant="outline" onClick={loadRatings} disabled={loading} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Ratings</p>
                <p className="text-2xl font-bold text-gray-900">{orderRatings.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agent Ratings</p>
                <p className="text-2xl font-bold text-gray-900">{agentRatings.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageRating(orderRatings)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Agent Rating</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageRating(agentRatings)}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Order Ratings ({orderRatings.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agent Ratings ({agentRatings.length})
          </button>
        </nav>
      </div>

      {/* Order Ratings Tab */}
      {activeTab === 'orders' && (
        <Card>
          {orderRatings.length === 0 ? (
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Order Ratings</CardTitle>
              <p className="text-gray-600">No customer ratings for orders yet.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderRatings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>
                      <p className="font-mono text-sm">
                        #{rating.order?.id?.slice(-8) || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rating.rated_by_user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rating.rated_by_user?.email || 'No email'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStars(rating.rating)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {rating.feedback || 'No feedback provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(rating.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Agent Ratings Tab */}
      {activeTab === 'agents' && (
        <Card>
          {agentRatings.length === 0 ? (
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Agent Ratings</CardTitle>
              <p className="text-gray-600">No customer ratings for delivery agents yet.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Rated By</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentRatings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rating.agent?.full_name || 'Unknown Agent'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rating.agent?.email || 'No email'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {rating.rated_by_user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rating.rated_by_user?.email || 'No email'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStars(rating.rating)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {rating.feedback || 'No feedback provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(rating.created_at), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}