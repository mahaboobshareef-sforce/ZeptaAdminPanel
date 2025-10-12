import React, { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, Eye, RefreshCw, MapPin, Phone, Mail, Store, Star, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { 
  fetchDeliveryAgents, 
  createDeliveryAgent, 
  updateDeliveryAgent, 
  updateDeliveryAgentStatus,
  deleteDeliveryAgent, 
  fetchStores,
  getAgentStats
} from '../lib/supabase';
import { format } from 'date-fns';

export default function DeliveryAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [agentStats, setAgentStats] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    store_id: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentsResult, storesResult] = await Promise.all([
        fetchDeliveryAgents(),
        fetchStores()
      ]);
      
      if (agentsResult.error) {
        throw new Error(agentsResult.error.message || 'Failed to fetch delivery agents');
      }
      
      if (storesResult.error) {
        console.warn('Failed to fetch stores:', storesResult.error);
      }
      
      const agentsData = agentsResult.data || [];
      setAgents(agentsData);
      setStores(storesResult.data || []);
      
      // Load stats for each agent
      const stats: any = {};
      for (const agent of agentsData) {
        const statsResult = await getAgentStats(agent.id);
        if (statsResult.data) {
          stats[agent.id] = statsResult.data;
        }
      }
      setAgentStats(stats);
      
    } catch (err) {
      console.error('❌ Delivery agents loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.mobile_number.trim()) {
      errors.mobile_number = 'Mobile number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await createDeliveryAgent({
        ...formData,
        store_id: formData.store_id || undefined
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create delivery agent');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to create delivery agent: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !validateForm()) return;
    
    try {
      const result = await updateDeliveryAgent(selectedAgent.id, {
        ...formData,
        store_id: formData.store_id || null
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update delivery agent');
      }
      
      setShowEditModal(false);
      setSelectedAgent(null);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to update delivery agent: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      setFiltering(true);
      console.log(`🔄 Toggling agent ${agentId} status from ${currentStatus} to ${!currentStatus}`);
      
      const result = await updateDeliveryAgentStatus(agentId, !currentStatus);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update agent status');
      }
      
      console.log('✅ Agent status updated successfully');
      
      // Update agent in state without full reload
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === agentId 
            ? { ...agent, is_active: !currentStatus }
            : agent
        )
      );
      
    } catch (err) {
      console.error('❌ Agent status update failed:', err);
      alert(`Failed to update agent status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFiltering(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this delivery agent?')) return;
    
    try {
      const result = await deleteDeliveryAgent(agentId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete delivery agent');
      }
      
      await loadData();
      
    } catch (err) {
      alert(`Failed to delete delivery agent: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', mobile_number: '', store_id: '' });
    setFormErrors({});
  };

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setFormData({
      full_name: agent.full_name || '',
      email: agent.email || '',
      mobile_number: agent.mobile_number || '',
      store_id: agent.store_id || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = async (agent: any) => {
    setSelectedAgent(agent);
    
    // Load detailed stats for this agent
    const statsResult = await getAgentStats(agent.id);
    if (statsResult.data) {
      setAgentStats({
        ...agentStats,
        [agent.id]: statsResult.data
      });
    }
    
    setShowViewModal(true);
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

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading delivery agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <UserPlus className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Delivery Agents Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>
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
          <h1 className="text-3xl font-bold text-gray-900">Delivery Agents</h1>
          <p className="text-gray-600">Manage delivery agents and assignments ({agents.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={UserPlus}>
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter(a => a.is_active).length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Location</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter(a => a.agent_location?.latitude).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.length > 0 
                    ? (Object.values(agentStats).reduce((sum: number, stats: any) => sum + (stats?.averageRating || 0), 0) / agents.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Delivery Agents Found</CardTitle>
            <p className="text-gray-600 mb-4">Get started by adding your first delivery agent.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={UserPlus}>
              Add First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Store Assignment</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Location Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const stats = agentStats[agent.id] || { deliveredOrders: 0, averageRating: 0, totalRatings: 0 };
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {agent.full_name?.charAt(0) || agent.email?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {agent.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{agent.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {agent.mobile_number || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.store ? (
                        <div>
                          <p className="font-medium text-gray-900">{agent.store.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{agent.store.address}</p>
                        </div>
                      ) : (
                        <Badge variant="warning">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{stats.deliveredOrders} orders</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {stats.averageRating > 0 ? stats.averageRating : 'No ratings'}
                          </span>
                          {stats.totalRatings > 0 && (
                            <span className="text-xs text-gray-500">({stats.totalRatings})</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.agent_location?.latitude ? (
                        <div>
                          <Badge variant="success">Location Active</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Updated: {format(new Date(agent.agent_location.updated_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="error">No Location</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleAgentStatus(agent.id, agent.is_active)}
                        className="focus:outline-none"
                      >
                        {agent.is_active ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <ToggleRight className="h-5 w-5" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-400">
                            <ToggleLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Inactive</span>
                          </div>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(agent)} icon={Eye}>
                          <span className="sr-only">View</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(agent)} icon={Edit}>
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent.id)} icon={Trash2}>
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Agent Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Delivery Agent"
        size="md"
      >
        <form onSubmit={handleCreateAgent}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(value) => setFormData({...formData, full_name: value})}
                required
                error={formErrors.full_name}
                placeholder="Enter agent's full name"
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({...formData, email: value})}
                required
                error={formErrors.email}
                placeholder="agent@zepta.com"
              />
              
              <Input
                label="Mobile Number"
                type="tel"
                value={formData.mobile_number}
                onChange={(value) => setFormData({...formData, mobile_number: value})}
                required
                error={formErrors.mobile_number}
                placeholder="+91 9876543210"
              />
              
              <Select
                label="Assign to Store"
                value={formData.store_id}
                onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                options={storeOptions}
                placeholder="Select Store (Optional)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Agent
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Agent Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAgent(null);
          resetForm();
        }}
        title="Edit Delivery Agent"
        size="md"
      >
        <form onSubmit={handleUpdateAgent}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(value) => setFormData({...formData, full_name: value})}
                required
                error={formErrors.full_name}
                placeholder="Enter agent's full name"
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({...formData, email: value})}
                required
                error={formErrors.email}
                placeholder="agent@zepta.com"
              />
              
              <Input
                label="Mobile Number"
                type="tel"
                value={formData.mobile_number}
                onChange={(value) => setFormData({...formData, mobile_number: value})}
                required
                error={formErrors.mobile_number}
                placeholder="+91 9876543210"
              />
              
              <Select
                label="Assign to Store"
                value={formData.store_id}
                onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                options={storeOptions}
                placeholder="Select Store (Optional)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedAgent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Agent
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Agent Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAgent(null);
        }}
        title="Agent Details"
        size="lg"
      >
        {selectedAgent && (
          <ModalBody>
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="h-20 w-20 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white font-medium text-2xl">
                    {selectedAgent.full_name?.charAt(0) || selectedAgent.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedAgent.full_name}</h3>
                  <p className="text-gray-600">{selectedAgent.email}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <Badge variant={selectedAgent.is_active ? 'success' : 'error'}>
                      {selectedAgent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedAgent.agent_location?.latitude && (
                      <Badge variant="success">Location Tracking</Badge>
                    )}
                    <Badge variant="info">
                      ID: {selectedAgent.id.slice(-8)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Performance Metrics - Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {agentStats[selectedAgent.id]?.deliveredOrders || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agentStats[selectedAgent.id]?.totalOrders || 0} total orders
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <div className="flex items-center space-x-1 mt-2">
                          {agentStats[selectedAgent.id]?.averageRating > 0 ? (
                            <>
                              <span className="text-2xl font-bold text-gray-900">
                                {agentStats[selectedAgent.id].averageRating}
                              </span>
                              <div className="flex ml-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= agentStats[selectedAgent.id].averageRating 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-gray-400">No ratings</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {agentStats[selectedAgent.id]?.totalRatings || 0} reviews
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {agentStats[selectedAgent.id]?.totalOrders > 0 
                            ? Math.round((agentStats[selectedAgent.id].deliveredOrders / agentStats[selectedAgent.id].totalOrders) * 100)
                            : 0
                          }%
                        </p>
                        <p className="text-xs text-gray-500">
                          Delivery completion rate
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact and Assignment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedAgent.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedAgent.mobile_number || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4 text-gray-400" />
                      <span>{selectedAgent.store?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Joined:</span> {format(new Date(selectedAgent.created_at), 'PPP')}</p>
                    <p><span className="font-medium">Last Updated:</span> {format(new Date(selectedAgent.updated_at), 'PPP')}</p>
                    <p><span className="font-medium">Auth ID:</span> {selectedAgent.id}</p>
                  </div>
                </div>
              </div>

              {selectedAgent.agent_location?.latitude && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Location</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-medium">Latitude:</span> {selectedAgent.agent_location.latitude}</p>
                        <p><span className="font-medium">Longitude:</span> {selectedAgent.agent_location.longitude}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Last Updated:</span></p>
                        <p>{format(new Date(selectedAgent.agent_location.updated_at), 'PPP p')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
        )}
      </Modal>
    </div>
  );
}