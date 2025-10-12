# Delivery Agent App Specification

## 🚚 **Zepta Delivery Agent App**

### **App Purpose:**
Mobile-optimized app for delivery agents to manage orders, track deliveries, and optimize routes.

## 🎨 **Design Theme:**
- **Professional Dashboard** (Uber Driver style)
- **Blue & Orange** color scheme  
- **Large touch targets** for mobile use
- **Minimal UI** focused on efficiency

## 📱 **Core Features**

### **1. Authentication & Setup**
```
Pages:
├── /login             - Agent login (email/password)
├── /setup             - Initial profile setup
├── /location-permission - GPS permission request
└── /training          - App usage tutorial
```

### **2. Order Dashboard**
```
Pages:
├── /                  - Main dashboard with assigned orders
├── /orders/new        - New order assignments
├── /orders/active     - Currently delivering
├── /orders/completed  - Delivery history
└── /orders/pending    - Waiting for pickup
```

### **3. Order Management**
```
Pages:
├── /order/:id         - Order details and actions
├── /pickup            - Order pickup confirmation
├── /delivery          - Delivery process with photo
├── /payment           - COD payment collection
└── /proof             - Delivery proof upload
```

### **4. Navigation & Tracking**
```
Pages:
├── /route             - Optimized route planning
├── /navigate/:id      - Turn-by-turn navigation
├── /location          - Current location sharing
└── /map               - Area coverage map
```

### **5. Performance & Earnings**
```
Pages:
├── /earnings          - Daily/weekly earnings
├── /performance       - Delivery metrics and ratings
├── /schedule          - Work schedule management
└── /profile           - Agent profile and settings
```

## 🔧 **Technical Implementation**

### **Database Integration:**
```typescript
// Agent-specific queries
const getAssignedOrders = () => supabase
  .from('orders')
  .select('*, customer:users!customer_id(*), order_items(*)')
  .eq('delivery_agent_id', user.id)
  .in('status', ['assigned_delivery_partner', 'out_for_delivery'])

const updateOrderStatus = (orderId, status) => supabase
  .from('orders')
  .update({ 
    status,
    status_updated_at: new Date().toISOString()
  })
  .eq('id', orderId)
  .eq('delivery_agent_id', user.id)

const updateLocation = (lat, lng) => supabase
  .from('agent_locations')
  .upsert({
    agent_id: user.id,
    latitude: lat,
    longitude: lng,
    updated_at: new Date().toISOString()
  })
```

### **Real-time Features:**
```typescript
// New order assignments
supabase
  .channel('agent-orders')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public', 
    table: 'orders',
    filter: `delivery_agent_id=eq.${user.id}`
  }, (payload) => {
    if (payload.new.status === 'assigned_delivery_partner') {
      showNewOrderNotification(payload.new)
    }
  })
  .subscribe()
```

## 🎯 **Agent Workflow**

### **Daily Workflow:**
1. **Login** → Start shift
2. **Check Orders** → View assignments
3. **Accept Orders** → Confirm pickup
4. **Navigate** → Route to store/customer
5. **Update Status** → Keep customers informed
6. **Collect Payment** → COD orders
7. **Complete Delivery** → Photo proof
8. **Rate Customer** → Service feedback

### **Order States for Agent:**
```
Agent Order Flow:
├── assigned_delivery_partner → Accept/Reject
├── out_for_delivery → Navigate & deliver
├── delivered → Complete with proof
└── Exception handling → Contact support
```

## 📊 **Key Metrics for Agents**

### **Performance Dashboard:**
- **Orders Completed**: Daily/weekly count
- **Average Rating**: Customer feedback score
- **Delivery Time**: Average completion time
- **Success Rate**: Completed vs assigned orders
- **Earnings**: Daily/weekly/monthly income

### **Real-time Tracking:**
- **Current Location**: GPS coordinates
- **Active Orders**: Orders in progress
- **Route Optimization**: Shortest path calculation
- **ETA Updates**: Estimated delivery time

## 🔄 **Integration Points**

### **With Admin Panel:**
- **Order Assignment**: Admin assigns → Agent receives
- **Status Updates**: Agent updates → Admin sees
- **Performance Tracking**: Admin monitors agent metrics
- **Location Monitoring**: Admin tracks agent locations

### **With Customer App:**
- **Delivery Updates**: Agent status → Customer sees
- **Location Sharing**: Agent location → Customer tracking
- **Communication**: In-app messaging
- **Delivery Confirmation**: Photo proof → Customer receives

## 🎨 **UI Components Needed**

### **Dashboard Components:**
- OrderCard, OrderList, StatusBadge
- EarningsCard, PerformanceMetrics
- LocationTracker, RouteMap

### **Order Components:**
- OrderDetails, CustomerInfo, DeliveryAddress
- StatusUpdater, PhotoCapture, PaymentCollector
- NavigationHelper, ProofUploader

### **Profile Components:**
- AgentProfile, ScheduleManager, SettingsPanel
- EarningsHistory, RatingDisplay, SupportChat