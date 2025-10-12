# Multi-App Deployment Guide

## 🎯 **Zepta Ecosystem Architecture**

This guide explains how to deploy and connect the 3 Zepta applications:

### **Applications:**
1. **Admin Panel** (Current) - Complete business management
2. **Customer App** (To build) - Shopping and order tracking  
3. **Delivery Agent App** (To build) - Order fulfillment

### **Shared Database:**
- **Single Supabase Instance** serves all 3 apps
- **Row Level Security** ensures data isolation
- **Same authentication system** across apps

## 🔐 **Shared Environment Variables**

### **Copy these to ALL 3 apps:**
```env
VITE_SUPABASE_URL=https://aigtxqdeasdjeeeasgue.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **App-Specific Variables:**
```env
# Admin Panel
VITE_APP_NAME=Zepta Admin Panel
VITE_APP_TYPE=admin

# Customer App  
VITE_APP_NAME=Zepta Customer App
VITE_APP_TYPE=customer

# Delivery Agent App
VITE_APP_NAME=Zepta Delivery Agent App
VITE_APP_TYPE=agent
```

## 🚀 **Deployment URLs**

### **Production URLs:**
- **Admin Panel**: https://admin.zepta.com
- **Customer App**: https://app.zepta.com  
- **Agent App**: https://agent.zepta.com

### **Development URLs:**
- **Admin Panel**: https://bolt.new/admin-project-id
- **Customer App**: https://bolt.new/customer-project-id
- **Agent App**: https://bolt.new/agent-project-id

## 📱 **App Features Matrix**

| Feature | Admin Panel | Customer App | Agent App |
|---------|-------------|--------------|-----------|
| **Authentication** | ✅ Admin only | ✅ Customer signup | ✅ Agent login |
| **Product Management** | ✅ Full CRUD | ✅ View only | ❌ No access |
| **Order Management** | ✅ All orders | ✅ Own orders | ✅ Assigned orders |
| **Inventory** | ✅ Full control | ❌ No access | ❌ No access |
| **User Management** | ✅ All users | ✅ Own profile | ✅ Own profile |
| **Analytics** | ✅ Full analytics | ✅ Order history | ✅ Earnings |
| **Location** | ✅ View all | ✅ Delivery tracking | ✅ GPS updates |

## 🔄 **Data Flow Between Apps**

### **Customer Places Order:**
```
Customer App → Supabase → Admin Panel
1. Customer selects products
2. Creates order in database  
3. Admin sees new order
4. Admin assigns delivery agent
5. Agent app gets notification
```

### **Agent Updates Delivery:**
```
Agent App → Supabase → Customer App
1. Agent updates order status
2. Database triggers notification
3. Customer sees real-time update
4. Admin tracks progress
```

## 🧪 **Testing Strategy**

### **End-to-End Testing Flow:**
1. **Admin**: Create products and manage inventory
2. **Customer**: Browse products and place order
3. **Admin**: Assign delivery agent to order
4. **Agent**: Accept and fulfill order
5. **Customer**: Track delivery and rate service
6. **Admin**: Analyze profit and performance

### **Cross-App Integration Tests:**
- [ ] Customer order appears in admin panel
- [ ] Agent assignment triggers agent app notification
- [ ] Order status updates sync across all apps
- [ ] Payment status reflects in all systems
- [ ] Inventory deductions work correctly

## 🔧 **Development Workflow**

### **Phase 1: Customer App (Week 1)**
- Build product catalog and shopping cart
- Implement order placement and tracking
- Test integration with admin panel

### **Phase 2: Agent App (Week 2)**  
- Build order dashboard and management
- Implement location tracking and updates
- Test integration with customer app

### **Phase 3: Integration Testing (Week 3)**
- End-to-end workflow testing
- Performance optimization
- Production deployment

## 📞 **Support & Maintenance**

### **Monitoring:**
- **Admin Panel**: Business metrics and system health
- **Customer App**: User engagement and order success
- **Agent App**: Delivery performance and efficiency

### **Updates:**
- **Database changes**: Apply to shared Supabase
- **Feature updates**: Deploy to specific apps
- **Bug fixes**: Independent app deployments