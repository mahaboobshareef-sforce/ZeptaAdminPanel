import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, X, Clock, Package, MapPin, Truck, RefreshCw, Filter, Zap, List, User, Star, Navigation, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { 
  fetchOrders, 
  updateOrderStatus, 
  assignDeliveryAgent, 
  fetchDeliveryAgents, 
  fetchStores, 
  checkBulkAvailabilityForOrder,
  deductFromBulkInventory,
  supabase 
} from '../lib/supabase';
import { format } from 'date-fns';
import type { OrderStatus } from '../types/database';

const statusColors = {
  pending: 'warning',
  order_accepted: 'info',
  packed: 'info',
  assigned_delivery_partner: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  cancelled: 'error',
  refund_initiated: 'warning',
  refund_completed: 'success',
  partial_refund: 'warning',
} as const;

const statusLabels = {
  pending: 'Pending',
  order_accepted: 'Confirmed',
  packed: 'Preparing',
  assigned_delivery_partner: 'Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_initiated: 'Refund Initiated',
  refund_completed: 'Refunded',
  partial_refund: 'Partial Refund',
};

const statusIcons = {
  pending: Clock,
  order_accepted: CheckCircle,
  packed: Package,
  assigned_delivery_partner: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle,
  cancelled: X,
  refund_initiated: Clock,
  refund_completed: CheckCircle,
  partial_refund: Clock,
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading orders...');
      
      const [ordersResult, agentsResult, storesResult] = await Promise.all([
        fetchOrders(),
        fetchDeliveryAgents(),
        fetchStores()
      ]);
      
      if (ordersResult.error) {
        throw new Error(ordersResult.error.message || 'Failed to fetch orders');
      }
      
      if (agentsResult.error) {
        console.warn('Failed to fetch agents:', agentsResult.error);
      }
      
      if (storesResult.error) {
        console.warn('Failed to fetch stores:', storesResult.error);
      }
      
      console.log('✅ Orders loaded:', ordersResult.data?.length || 0);
      console.log('📊 Sample order data:', {
        orderId: ordersResult.data?.[0]?.id,
        itemsCount: ordersResult.data?.[0]?.order_items?.length,
        firstItem: ordersResult.data?.[0]?.order_items?.[0],
        hasProduct: !!ordersResult.data?.[0]?.order_items?.[0]?.product,
        hasVariant: !!ordersResult.data?.[0]?.order_items?.[0]?.variant
      });
      setOrders(ordersResult.data || []);
      setAgents(agentsResult.data || []);
      setStores(storesResult.data || []);
      
    } catch (err: any) {
      console.error('❌ Orders loading failed:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setFiltering(true);
      
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update order');
      }
      
      // Update order in state without full reload
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, status_updated_at: new Date().toISOString() }
            : order
        )
      );
      
    } catch (err: any) {
      alert(`Failed to update order: ${err.message || 'Unknown error'}`);
    } finally {
      setFiltering(false);
    }
  };

  const handleAssignAgent = async (orderId: string, agentId: string) => {
    try {
      setUpdating(orderId);
      
      const result = await assignDeliveryAgent(orderId, agentId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to assign delivery agent');
      }
      
      setShowDriverSelection(false);
      setSelectedOrderForDriver(null);
      await loadOrders();
      
    } catch (err: any) {
      alert(`Failed to assign agent: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get agent workload (number of active orders)
  const getAgentWorkload = (agentId: string): number => {
    return orders.filter(order => 
      order.delivery_agent_id === agentId && 
      ['assigned_delivery_partner', 'out_for_delivery'].includes(order.status)
    ).length;
  };

  // Get agent rating (mock function - you can implement actual rating calculation)
  const getAgentRating = (agentId: string): number => {
    // Mock rating between 3.5 and 5.0
    return 4.0 + Math.random() * 1.0;
  };

  // Find best delivery agent using proximity, workload, and rating
  const findBestDeliveryAgent = (order: any): any | null => {
    // First try to find agents with location data
    let availableAgents = agents.filter(agent => 
      agent.is_active && agent.agent_location?.latitude && agent.agent_location?.longitude
    );

    // If no agents with location, fall back to any active agent
    if (availableAgents.length === 0) {
      availableAgents = agents.filter(agent => agent.is_active);
    }

    // If still no agents, return null
    if (availableAgents.length === 0) {
      return null;
    }

    const store = stores.find(s => s.id === order.store_id);
    
    // If we have store location and agent locations, use proximity-based assignment
    if (store?.latitude && store?.longitude && availableAgents.some(a => a.agent_location?.latitude)) {
      const agentsWithLocation = availableAgents.filter(a => a.agent_location?.latitude);
      
      if (agentsWithLocation.length > 0) {
        return assignByProximityAndWorkload(agentsWithLocation, store);
      }
    }

    // Fallback: assign by workload only
    return assignByWorkloadOnly(availableAgents);
  };

  const assignByProximityAndWorkload = (agentsWithLocation: any[], store: any) => {
    // Calculate scores for each agent
    const agentScores = agentsWithLocation.map(agent => {
      const distance = calculateDistance(
        store.latitude,
        store.longitude,
        agent.agent_location.latitude,
        agent.agent_location.longitude
      );
      
      const workload = getAgentWorkload(agent.id);
      const rating = getAgentRating(agent.id);

      // Scoring algorithm (lower is better)
      // Distance: 0-50 points (closer is better)
      // Workload: 0-30 points (less work is better)
      // Rating: 0-20 points (higher rating is better)
      const distanceScore = Math.min(distance * 2, 50); // Max 50 points for distance
      const workloadScore = Math.min(workload * 10, 30); // Max 30 points for workload
      const ratingScore = (5 - rating) * 4; // Max 20 points (inverted, so higher rating = lower score)
      
      const totalScore = distanceScore + workloadScore + ratingScore;

      return {
        agent,
        distance,
        workload,
        rating,
        totalScore
      };
    });

    // Sort by total score (ascending - lower is better)
    agentScores.sort((a, b) => a.totalScore - b.totalScore);
    
    return agentScores[0]?.agent;
  };

  const assignByWorkloadOnly = (availableAgents: any[]) => {
    // Sort agents by workload (ascending - less work is better)
    const agentsByWorkload = availableAgents.map(agent => ({
      agent,
      workload: getAgentWorkload(agent.id),
      rating: getAgentRating(agent.id)
    }));

    // Sort by workload first, then by rating
    agentsByWorkload.sort((a, b) => {
      if (a.workload !== b.workload) {
        return a.workload - b.workload; // Less work is better
      }
      return b.rating - a.rating; // Higher rating is better
    });

    return agentsByWorkload[0]?.agent;
  };

  const handleAutoAssignSingle = async (order: any) => {
    try {
      setUpdating(order.id);
      
      const bestAgent = findBestDeliveryAgent(order);
      
      if (!bestAgent) {
        alert('No suitable delivery agent found for auto-assignment');
        return;
      }
      
      await handleAssignAgent(order.id, bestAgent.id);
      
    } catch (err) {
      alert('Auto-assignment failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleAutoAssignAll = async () => {
    const pendingOrders = orders.filter(o => 
      ['order_accepted', 'packed'].includes(o.status) && !o.delivery_agent_id
    );
    
    if (pendingOrders.length === 0) {
      alert('No orders ready for delivery assignment. Orders must be in "Confirmed" or "Preparing" status.');
      return;
    }

    const activeAgents = agents.filter(agent => agent.is_active);
    if (activeAgents.length === 0) {
      alert('No active delivery agents available. Please activate some agents first.');
      return;
    }
    
    try {
      setUpdating('auto-assign');
      let assignedCount = 0;
      let failedCount = 0;
      
      for (const order of pendingOrders) {
        const bestAgent = findBestDeliveryAgent(order);
        
        if (bestAgent) {
          try {
            await handleAssignAgent(order.id, bestAgent.id);
            assignedCount++;
            console.log(`✅ Assigned order ${order.id} to ${bestAgent.full_name}`);
          } catch (err) {
            console.error(`❌ Failed to assign order ${order.id}:`, err);
            failedCount++;
          }
        } else {
          failedCount++;
        }
      }
      
      if (assignedCount > 0) {
        alert(`✅ Successfully auto-assigned ${assignedCount} orders${failedCount > 0 ? `. ${failedCount} assignments failed.` : '!'}`);
      } else {
        alert(`❌ Could not assign any orders. Please check that you have active delivery agents.`);
      }
      
    } catch (err) {
      console.error('Auto-assign failed:', err);
      alert(`Auto-assignment process failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const openOrderItems = (order: any) => {
    setSelectedOrder(order);
    setShowOrderItems(true);
  };

  const openDriverSelection = (order: any) => {
    setSelectedOrderForDriver(order);
    setShowDriverSelection(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Orders Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadOrders}>
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadOrders} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <Button 
            onClick={handleAutoAssignAll} 
            disabled={updating === 'auto-assign' || orders.filter(o => ['order_accepted', 'packed'].includes(o.status) && !o.delivery_agent_id).length === 0}
            icon={Zap}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updating === 'auto-assign' ? 'Assigning...' : `Auto Assign All (${orders.filter(o => ['order_accepted', 'packed'].includes(o.status) && !o.delivery_agent_id).length})`}
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
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="order_accepted">Confirmed</option>
            <option value="packed">Preparing</option>
            <option value="assigned_delivery_partner">Assigned</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Orders Found</CardTitle>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'No orders in your database yet.' 
                : `No orders with status "${statusFilter}" found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          ORD-{order.id.slice(-3).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {format(new Date(order.created_at), 'M/d/yyyy, h:mm a')}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer?.full_name || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          📞 {order.customer?.mobile_number || 'No phone'}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.order_items?.length || 0} items
                        </p>
                        <button
                          onClick={() => openOrderItems(order)}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View Items
                        </button>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">
                          ₹{Number(order.order_total || 0).toLocaleString()}
                        </p>
                        <Badge 
                          variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {order.payment_status || 'pending'}
                        </Badge>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id}
                        className={`text-sm rounded-md border-0 py-1.5 px-3 focus:ring-2 focus:ring-indigo-500 ${
                          statusColors[order.status] === 'success' ? 'bg-green-100 text-green-800' :
                          statusColors[order.status] === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          statusColors[order.status] === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="order_accepted">Confirmed</option>
                        <option value="packed">Preparing</option>
                        <option value="assigned_delivery_partner">Assigned</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.delivery_agent_id ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {agents.find(a => a.id === order.delivery_agent_id)?.full_name || 'Unknown Agent'}
                          </p>
                          <p className="text-xs text-gray-500">Assigned</p>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDriverSelection(order)}
                            disabled={updating === order.id}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            📱 Manual
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAutoAssignSingle(order)}
                            disabled={updating === order.id}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            ⚡ Auto
                          </Button>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          👁️
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          ✏️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        title={`Order Details - ORD-${selectedOrder?.id?.slice(-3).toUpperCase() || ''}`}
        size="xl"
      >
        {selectedOrder && (
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.customer?.full_name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-gray-600">
                      +{selectedOrder.customer?.mobile_number || 'No phone'}
                    </p>
                  </div>
                  
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="text-sm text-gray-600">
                        <p>{selectedOrder.delivery_address.address_line1}</p>
                        {selectedOrder.delivery_address.address_line2 && (
                          <p>{selectedOrder.delivery_address.address_line2}</p>
                        )}
                        <p>
                          {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} {selectedOrder.delivery_address.pincode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={statusColors[selectedOrder.status]}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <Badge variant={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}>
                      {selectedOrder.payment_status || 'pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Time:</span>
                    <span className="font-medium">
                      {format(new Date(selectedOrder.created_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.order_items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.variant?.product?.image_url ? (
                        <img 
                          src={item.variant.product.image_url} 
                          alt={item.variant.product.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.variant?.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{Number(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{Number(selectedOrder.order_total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>

      {/* Order Items Modal */}
      <Modal
        isOpen={showOrderItems}
        onClose={() => {
          setShowOrderItems(false);
          setSelectedOrder(null);
        }}
        title={`Order Items - ORD-${selectedOrder?.id?.slice(-3).toUpperCase() || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <ModalBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Items in this order</h3>
                <Badge variant={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
              </div>
              
              {selectedOrder.order_items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.variant?.product?.image_url ? (
                      <img 
                        src={item.variant.product.image_url} 
                        alt={item.variant.product.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.variant?.product?.name || 'Unknown Product'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.variant?.unit_label} • Qty: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₹{Number(item.price).toLocaleString()} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{Number(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{Number(selectedOrder.order_total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>

      {/* Driver Selection Modal */}
      <Modal
        isOpen={showDriverSelection}
        onClose={() => {
          setShowDriverSelection(false);
          setSelectedOrderForDriver(null);
        }}
        title={`Select Delivery Partner - ORD-${selectedOrderForDriver?.id?.slice(-3).toUpperCase() || ''}`}
        size="md"
      >
        {selectedOrderForDriver && (
          <>
            <ModalBody>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                  <p className="text-sm text-gray-600">
                    Customer: {selectedOrderForDriver.customer?.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {selectedOrderForDriver.order_items?.length} items
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ₹{Number(selectedOrderForDriver.order_total).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Available Delivery Partners</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.filter(a => a.is_active).map(agent => {
                      const workload = getAgentWorkload(agent.id);
                      const rating = getAgentRating(agent.id);
                      
                      return (
                        <div
                          key={agent.id}
                          onClick={() => handleAssignAgent(selectedOrderForDriver.id, agent.id)}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {agent.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{agent.full_name}</p>
                              <p className="text-sm text-gray-500">{agent.mobile_number}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{rating.toFixed(1)}</span>
                            </div>
                            <p className="text-gray-500">{workload} active orders</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDriverSelection(false);
                  setSelectedOrderForDriver(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAutoAssignSingle(selectedOrderForDriver)}
                disabled={updating === selectedOrderForDriver.id}
                className="bg-green-600 hover:bg-green-700"
              >
                ⚡ Auto Assign Best
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}