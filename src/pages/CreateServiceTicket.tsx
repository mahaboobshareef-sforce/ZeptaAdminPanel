import React, { useState } from 'react';
import { Search, Phone, Package, User, Mail, MapPin, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';

const priorityOptions = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' }
];

const categoryOptions = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'other', label: 'Other' }
];

export default function CreateServiceTicket() {
  const { can, loading: permissionsLoading } = usePermissions();
  const [searchMobile, setSearchMobile] = useState('');
  const [searching, setSearching] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'order_issue',
    priority: 'medium',
    description: '',
    order_id: ''
  });

  const searchCustomerOrders = async () => {
    if (!searchMobile || searchMobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    try {
      setSearching(true);
      setCustomerOrders([]);
      setCustomerInfo(null);

      // Search for customer by mobile number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, mobile_number')
        .eq('mobile_number', searchMobile)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        toast.error('No customer found with this mobile number');
        return;
      }

      setCustomerInfo(userData);

      // Fetch orders for this customer
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores!store_id(name),
          delivery_agent:users!delivery_agent_id(full_name)
        `)
        .eq('customer_id', userData.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setCustomerOrders(ordersData || []);

      if (ordersData && ordersData.length === 0) {
        toast('Customer found, but no orders yet', { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${ordersData?.length || 0} orders`);
      }

    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search customer orders');
    } finally {
      setSearching(false);
    }
  };

  const openTicketForm = (order?: any) => {
    setSelectedOrder(order || null);
    setTicketForm({
      subject: order ? `Issue with Order #${order.order_number}` : '',
      category: 'order_issue',
      priority: 'medium',
      description: '',
      order_id: order?.id || ''
    });
    setShowTicketForm(true);
  };

  const submitTicket = async () => {
    if (!customerInfo) {
      toast.error('No customer selected');
      return;
    }

    if (!ticketForm.subject || !ticketForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const ticketData = {
        customer_id: customerInfo.id,
        order_id: ticketForm.order_id || null,
        subject: ticketForm.subject,
        category: ticketForm.category,
        priority: ticketForm.priority,
        description: ticketForm.description,
        status: 'open'
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Support ticket created successfully!');
      setShowTicketForm(false);

      // Reset form
      setTicketForm({
        subject: '',
        category: 'order_issue',
        priority: 'medium',
        description: '',
        order_id: ''
      });

    } catch (err) {
      console.error('Failed to create ticket:', err);
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return null;
  }

  if (!can('manage_support_tickets')) {
    return null;
  }

  const statusColors: Record<string, any> = {
    pending: 'warning',
    order_accepted: 'info',
    packed: 'info',
    assigned_delivery_partner: 'info',
    out_for_delivery: 'warning',
    delivered: 'success',
    cancelled: 'error',
    refund_initiated: 'warning',
    refund_completed: 'success'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Service Ticket</h1>
          <p className="text-gray-600">Search customer by mobile number and create support tickets</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Search Customer Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Customer Mobile Number"
                placeholder="Enter 10-digit mobile number"
                value={searchMobile}
                onChange={setSearchMobile}
                icon={Phone}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchCustomerOrders}
                disabled={searching || !searchMobile}
                className="whitespace-nowrap"
              >
                {searching ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info Card */}
      {customerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{customerInfo.full_name}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{customerInfo.email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="font-medium">{customerInfo.mobile_number}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button onClick={() => openTicketForm()} variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                Create General Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      {customerOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Customer Orders ({customerOrders.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {order.store?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      ₹{order.order_total?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.status] || 'default'}>
                        {order.status?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTicketForm(order)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Create Ticket
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showTicketForm}
        onClose={() => setShowTicketForm(false)}
        title={selectedOrder ? `Create Ticket for Order #${selectedOrder.order_number}` : 'Create Support Ticket'}
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Subject"
              placeholder="Brief description of the issue"
              value={ticketForm.subject}
              onChange={(value) => setTicketForm({ ...ticketForm, subject: value })}
              required
            />

            <Select
              label="Category"
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              options={categoryOptions}
            />

            <Select
              label="Priority"
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
              options={priorityOptions}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
                placeholder="Detailed description of the issue..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                required
              />
            </div>

            {selectedOrder && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Order #:</span> {selectedOrder.order_number}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  <p><span className="font-medium">Total:</span> ₹{selectedOrder.order_total?.toFixed(2)}</p>
                  <p><span className="font-medium">Status:</span> {selectedOrder.status?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowTicketForm(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submitTicket}
            disabled={submitting || !ticketForm.subject || !ticketForm.description}
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
