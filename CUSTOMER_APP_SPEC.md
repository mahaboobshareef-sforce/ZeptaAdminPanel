# Customer App Specification

## 🛒 **Zepta Customer App**

### **App Purpose:**
Mobile-first shopping app for customers to browse products, place orders, and track deliveries.

## 🎨 **Design Theme:**
- **Modern E-commerce** (Swiggy/Zomato style)
- **Green & Fresh** color scheme
- **Mobile-first** responsive design
- **Smooth animations** and micro-interactions

## 📱 **Core Features**

### **1. Authentication & Onboarding**
```
Pages:
├── /welcome           - App introduction
├── /login             - Customer login
├── /register          - New customer signup
├── /verify-otp        - Phone verification
└── /onboarding        - Address setup
```

### **2. Product Discovery**
```
Pages:
├── /                  - Home with categories & featured
├── /search            - Product search with filters
├── /category/:id      - Category product listing
├── /product/:id       - Product details with variants
└── /offers            - Deals and promotions
```

### **3. Shopping & Checkout**
```
Pages:
├── /cart              - Shopping cart management
├── /checkout          - Order placement flow
├── /address           - Delivery address selection
├── /payment           - Payment method selection
└── /order-success     - Order confirmation
```

### **4. Order Management**
```
Pages:
├── /orders            - Order history
├── /order/:id         - Order tracking with live updates
├── /track             - Live delivery tracking with map
└── /rate-order        - Order rating and feedback
```

### **5. Profile & Settings**
```
Pages:
├── /profile           - Profile management
├── /addresses         - Manage delivery addresses
├── /notifications     - Order and promo notifications
└── /support           - Help and customer support
```

## 🔧 **Technical Implementation**

### **Database Integration:**
```typescript
// Customer-specific queries
const getProducts = () => supabase
  .from('product_catalog')
  .select('*')
  .eq('is_active', true)

const placeOrder = (orderData) => supabase
  .from('orders')
  .insert({
    customer_id: user.id,
    ...orderData
  })

const getMyOrders = () => supabase
  .from('orders')
  .select('*, order_items(*)')
  .eq('customer_id', user.id)
```

### **Real-time Features:**
```typescript
// Order status updates
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `customer_id=eq.${user.id}`
  }, (payload) => {
    updateOrderStatus(payload.new)
  })
  .subscribe()
```

## 🎯 **User Journey**

### **First-Time User:**
1. **Welcome Screen** → Download app intro
2. **Registration** → Phone + email signup
3. **Address Setup** → Add delivery location
4. **Browse Products** → Discover catalog
5. **First Order** → Guided checkout experience

### **Returning User:**
1. **Quick Login** → Biometric/PIN
2. **Personalized Home** → Based on order history
3. **Quick Reorder** → Previous order items
4. **Express Checkout** → Saved addresses/payments

## 📊 **Key Metrics to Track**

### **Business Metrics:**
- **Conversion Rate**: Visitors → Orders
- **Average Order Value**: Revenue per order
- **Customer Retention**: Repeat order rate
- **Cart Abandonment**: Checkout completion rate

### **Technical Metrics:**
- **App Performance**: Load times, crashes
- **API Response**: Database query speed
- **User Engagement**: Session duration, page views
- **Error Rates**: Failed orders, payment issues

## 🔄 **Integration Points**

### **With Admin Panel:**
- **Product Sync**: Real-time inventory updates
- **Order Creation**: New orders appear instantly
- **Status Updates**: Admin changes reflect in customer app

### **With Agent App:**
- **Delivery Tracking**: Live location updates
- **Status Updates**: Agent updates show to customer
- **Communication**: In-app messaging

## 🎨 **UI Components Needed**

### **Product Components:**
- ProductCard, ProductGrid, ProductDetails
- CategoryCard, SearchBar, FilterPanel
- PriceDisplay, VariantSelector, StockIndicator

### **Cart Components:**
- CartItem, CartSummary, QuantitySelector
- CouponInput, DeliveryCharges, OrderTotal

### **Order Components:**
- OrderCard, OrderStatus, TrackingMap
- DeliveryProgress, RatingModal, OrderHistory

### **Profile Components:**
- AddressCard, AddressForm, ProfileForm
- NotificationItem, SupportChat