import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, Phone, User, Mail, Package, X } from 'lucide-react';
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
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const issueTypeOptions = [
  { value: 'damaged_product', label: 'Damaged Product' },
  { value: 'spoiled_product', label: 'Spoiled Product' },
  { value: 'missing_items', label: 'Missing Items' },
  { value: 'wrong_items', label: 'Wrong Items' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'quantity_mismatch', label: 'Quantity Mismatch' },
  { value: 'packaging_issue', label: 'Packaging Issue' },
  { value: 'late_delivery', label: 'Late Delivery' },
  { value: 'other', label: 'Other' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export default function SupportTickets() {
  const { can, loading: permissionsLoading } = usePermissions();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create ticket modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searching, setSearching] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    issue_type: 'delivery_issue',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const customerIds = [...new Set(data.map(t => t.customer_id))];
        const orderIds = [...new Set(data.map(t => t.order_id).filter(Boolean))];

        const [customersRes, ordersRes] = await Promise.all([
          supabase.from('users').select('id, full_name, email, mobile_number').in('id', customerIds),
          orderIds.length > 0
            ? supabase.from('orders').select('id, order_number, order_total, status').in('id', orderIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        const customersMap = new Map(customersRes.data?.map(c => [c.id, c]) || []);
        const ordersMap = new Map(ordersRes.data?.map(o => [o.id, o]) || []);

        const enrichedData = data.map(ticket => ({
          ...ticket,
          customer: customersMap.get(ticket.customer_id),
          order: ticket.order_id ? ordersMap.get(ticket.order_id) : null
        }));

        setTickets(enrichedData);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomerOrders = async () => {
    if (!searchMobile || searchMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setSearching(true);
      setCustomerOrders([]);
      setCustomerInfo(null);
      setSelectedOrder(null);

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

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      setCustomerOrders(ordersData || []);

      if (ordersData && ordersData.length === 0) {
        toast('Customer found, but no orders yet', { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${ordersData?.length || 0} orders`);
      }

    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search customer');
    } finally {
      setSearching(false);
    }
  };

  const selectOrder = (order: any) => {
    setSelectedOrder(order);
    setTicketForm({
      ...ticketForm,
      subject: `Issue with Order #${order.order_number}`
    });
  };

  const submitTicket = async () => {
    if (!customerInfo) {
      toast.error('Please search for a customer first');
      return;
    }

    if (!ticketForm.subject || !ticketForm.description) {
      toast.error('Please fill in subject and description');
      return;
    }

    try {
      setSubmitting(true);

      const ticketData = {
        customer_id: customerInfo.id,
        order_id: selectedOrder?.id || null,
        subject: ticketForm.subject,
        issue_type: ticketForm.issue_type,
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
      setShowCreateModal(false);
      resetCreateForm();
      loadTickets();

    } catch (err) {
      console.error('Failed to create ticket:', err);
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setSearchMobile('');
    setCustomerInfo(null);
    setCustomerOrders([]);
    setSelectedOrder(null);
    setTicketForm({
      subject: '',
      issue_type: 'delivery_issue',
      priority: 'medium',
      description: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter === 'all') return true;
    return ticket.status === statusFilter;
  });

  if (permissionsLoading) {
    return null;
  }

  if (!can('manage_support')) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage customer support tickets and issues</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              All Tickets ({filteredTickets.length})
            </CardTitle>
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a new support ticket to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticket_number || `#${ticket.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.customer?.full_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{ticket.customer?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>
                      {ticket.order ? `#${ticket.order.order_number}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create Support Ticket"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Step 1: Search Customer */}
            <div>
              <h3 className="text-lg font-medium mb-4">1. Search Customer</h3>
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
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {customerInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Customer Found</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{customerInfo.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{customerInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mobile</p>
                    <p className="font-medium">{customerInfo.mobile_number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Order (Optional) */}
            {customerInfo && (
              <div>
                <h3 className="text-lg font-medium mb-4">2. Select Order (Optional)</h3>
                {customerOrders.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-gray-500">
                    <Package className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                    <p>No orders found for this customer</p>
                    <p className="text-sm">You can still create a general support ticket</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      {customerOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => selectOrder(order)}
                          className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Order #{order.order_number}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')} • ₹{order.order_total}
                              </p>
                            </div>
                            <Badge variant={selectedOrder?.id === order.id ? 'success' : 'default'}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedOrder && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Clear Selection (General Ticket)
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Ticket Details */}
            {customerInfo && (
              <div>
                <h3 className="text-lg font-medium mb-4">3. Ticket Details</h3>
                <div className="space-y-4">
                  <Input
                    label="Subject *"
                    placeholder="Brief description of the issue"
                    value={ticketForm.subject}
                    onChange={(value) => setTicketForm({ ...ticketForm, subject: value })}
                  />

                  <Select
                    label="Issue Type"
                    value={ticketForm.issue_type}
                    onChange={(e) => setTicketForm({ ...ticketForm, issue_type: e.target.value })}
                    options={issueTypeOptions}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Detailed description of the issue..."
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submitTicket}
            disabled={submitting || !customerInfo || !ticketForm.subject || !ticketForm.description}
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
