import React, { useEffect, useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Search, Filter, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type TicketStatus = 'open' | 'in_progress' | 'awaiting_customer' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
type IssueType = 'damaged_product' | 'spoiled_product' | 'missing_items' | 'wrong_items' | 'delivery_issue' | 'quality_issue' | 'quantity_mismatch' | 'packaging_issue' | 'late_delivery' | 'other';

interface SupportTicket {
  id: string;
  ticket_number: string;
  order_id: string | null;
  customer_id: string;
  issue_type: IssueType;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  affected_items: any[];
  resolution_type: string | null;
  resolution_notes: string | null;
  refund_amount: number | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    email: string;
    full_name: string;
    phone: string;
  };
  order?: {
    id: string;
    order_total: number;
  };
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin' | 'system';
  message: string;
  is_internal_note: boolean;
  created_at: string;
  sender?: {
    email: string;
    full_name: string;
  };
}

interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_url: string;
  file_type: string;
  file_name: string | null;
  created_at: string;
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    resolution_type: '',
    resolution_notes: '',
    refund_amount: ''
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

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Fetch related data separately
      if (data && data.length > 0) {
        const customerIds = [...new Set(data.map(t => t.customer_id))];
        const orderIds = [...new Set(data.map(t => t.order_id).filter(Boolean))];

        const [customersRes, ordersRes] = await Promise.all([
          supabase.from('users').select('id, email, full_name, phone').in('id', customerIds),
          orderIds.length > 0
            ? supabase.from('orders').select('id, order_total').in('id', orderIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        // Map customers and orders to tickets
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
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const [messagesRes, attachmentsRes] = await Promise.all([
        supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true }),
        supabase
          .from('ticket_attachments')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
      ]);

      if (messagesRes.error) throw messagesRes.error;
      if (attachmentsRes.error) throw attachmentsRes.error;

      // Fetch sender details for messages
      const messages = messagesRes.data || [];
      if (messages.length > 0) {
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: senders } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', senderIds);

        const sendersMap = new Map(senders?.map(s => [s.id, s]) || []);
        const enrichedMessages = messages.map(msg => ({
          ...msg,
          sender: sendersMap.get(msg.sender_id)
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }

      setAttachments(attachmentsRes.data || []);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast.error('Failed to load ticket details');
    }
  };

  const openTicketDetail = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
    await loadTicketDetails(ticket.id);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        const { data: userData } = await supabase.auth.getUser();
        updates.resolved_by = userData.user?.id;
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket status updated');
      loadTickets();

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const updateTicketPriority = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Priority updated');
      loadTickets();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: userData.user?.id,
          sender_type: 'admin',
          message: newMessage.trim(),
          is_internal_note: isInternalNote
        });

      if (error) throw error;

      setNewMessage('');
      setIsInternalNote(false);
      toast.success(isInternalNote ? 'Internal note added' : 'Message sent');
      await loadTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const resolveTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolution_type: resolutionData.resolution_type || null,
          resolution_notes: resolutionData.resolution_notes || null,
          refund_amount: resolutionData.refund_amount ? parseFloat(resolutionData.refund_amount) : null,
          resolved_by: userData.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Ticket resolved successfully');
      setShowDetailModal(false);
      loadTickets();
      setResolutionData({ resolution_type: '', resolution_notes: '', refund_amount: '' });
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast.error('Failed to resolve ticket');
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const matchesSearch =
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const getStatusBadge = (status: TicketStatus) => {
    const variants: Record<TicketStatus, 'success' | 'warning' | 'error' | 'info'> = {
      open: 'error',
      in_progress: 'warning',
      awaiting_customer: 'info',
      resolved: 'success',
      closed: 'success'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const variants: Record<TicketPriority, 'success' | 'warning' | 'error' | 'info'> = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getIssueTypeLabel = (type: IssueType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    critical: tickets.filter(t => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
          <p className="text-gray-600 mt-1">Manage customer issues and complaints</p>
        </div>
        <Button onClick={loadTickets} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tickets, customers, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer">Awaiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredTickets().map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.customer?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{ticket.customer?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getIssueTypeLabel(ticket.issue_type)}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openTicketDetail(ticket)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {getFilteredTickets().length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Ticket ${selectedTicket?.ticket_number}`}
        size="xl"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{selectedTicket.customer?.full_name}</p>
                <p className="text-sm text-gray-500">{selectedTicket.customer?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono text-sm">{selectedTicket.order_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issue Type</p>
                <p className="font-medium">{getIssueTypeLabel(selectedTicket.issue_type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{format(new Date(selectedTicket.created_at), 'PPpp')}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Subject</h3>
              <p className="text-gray-700">{selectedTicket.subject}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {attachments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Evidence Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.file_url}
                      alt="Evidence"
                      className="w-full h-32 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Communication</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender_type === 'customer'
                        ? 'bg-blue-50 ml-8'
                        : msg.is_internal_note
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">
                        {msg.sender_type === 'customer' ? 'Customer' : msg.sender?.full_name || 'Admin'}
                        {msg.is_internal_note && <span className="ml-2 text-yellow-600">(Internal Note)</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(msg.created_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Send Response</h3>
              <textarea
                className="w-full border rounded-lg p-3 min-h-24"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="mr-2"
                  />
                  Internal note (customer won't see this)
                </label>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send Message
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Update Status</h3>
              <div className="flex gap-2 mb-4">
                <Select
                  value={selectedTicket.status}
                  onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                  className="flex-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_customer">Awaiting Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
                <Select
                  value={selectedTicket.priority}
                  onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value as TicketPriority)}
                  className="flex-1"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </Select>
              </div>
            </div>

            {!['resolved', 'closed'].includes(selectedTicket.status) && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Resolve Ticket</h3>
                <div className="space-y-3">
                  <Select
                    value={resolutionData.resolution_type}
                    onChange={(e) => setResolutionData({ ...resolutionData, resolution_type: e.target.value })}
                  >
                    <option value="">Select resolution type</option>
                    <option value="full_refund">Full Refund</option>
                    <option value="partial_refund">Partial Refund</option>
                    <option value="replacement">Replacement</option>
                    <option value="store_credit">Store Credit</option>
                    <option value="no_action">No Action Required</option>
                    <option value="other">Other</option>
                  </Select>
                  {['full_refund', 'partial_refund', 'store_credit'].includes(resolutionData.resolution_type) && (
                    <Input
                      type="number"
                      placeholder="Refund/Credit Amount"
                      value={resolutionData.refund_amount}
                      onChange={(e) => setResolutionData({ ...resolutionData, refund_amount: e.target.value })}
                    />
                  )}
                  <textarea
                    className="w-full border rounded-lg p-3 min-h-20"
                    placeholder="Resolution notes..."
                    value={resolutionData.resolution_notes}
                    onChange={(e) => setResolutionData({ ...resolutionData, resolution_notes: e.target.value })}
                  />
                  <Button onClick={resolveTicket} variant="primary" className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve Ticket
                  </Button>
                </div>
              </div>
            )}

            {selectedTicket.resolution_notes && (
              <div className="border-t pt-4 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Resolution</h3>
                <p className="text-sm text-green-800">
                  <strong>Type:</strong> {selectedTicket.resolution_type?.replace('_', ' ')}
                </p>
                {selectedTicket.refund_amount && (
                  <p className="text-sm text-green-800">
                    <strong>Amount:</strong> ₹{selectedTicket.refund_amount}
                  </p>
                )}
                <p className="text-sm text-green-800 mt-2">{selectedTicket.resolution_notes}</p>
                <p className="text-xs text-green-600 mt-2">
                  Resolved on {format(new Date(selectedTicket.resolved_at!), 'PPpp')}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
