// ==================== USER & AUTH TYPES ====================
export type UserRole = 'buyer' | 'seller' | 'admin'

export interface User {
  id
  name
  email
  phone
  role
  avatar?
  createdAt
}

export interface Seller extends User {
  role: 'seller'
  businessName
  businessType: 'farmer' | 'wholesaler' | 'cooperative'
  gstNumber?
  panNumber?
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected'
  rating
  totalSales
  bankDetails?: {
    accountNumber
    ifscCode
    bankName
  }
}

export interface Admin extends User {
  role: 'admin'
  permissions: string[]
}

// ==================== PRODUCT TYPES ====================
export interface Category {
  id
  name
  slug
  icon
  description?
  parentId?
  productCount
}

export interface Product {
  id
  name
  slug
  description
  categoryId
  categoryName
  sellerId
  sellerName
  images: string[]
  basePrice
  unit: 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen' | 'litre'
  minOrderQty
  maxOrderQty?
  stockQty
  isOrganic
  isFeatured
  rating
  reviewCount
  status: 'active' | 'inactive' | 'out_of_stock'
  createdAt
  updatedAt
}

export interface ProductVariant {
  id
  productId
  name
  price
  stockQty
  sku
}

// ==================== ORDER TYPES ====================
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export interface OrderItem {
  id
  productId
  productName
  productImage
  quantity
  unit
  pricePerUnit
  totalPrice
  sellerId
  sellerName
}

export interface Order {
  id
  orderNumber
  buyerId
  buyerName
  buyerPhone
  items: OrderItem[]
  subtotal
  deliveryFee
  tax
  discount
  total
  status
  paymentMethod: 'cod' | 'upi'
  paymentStatus: 'Pending Payment' | 'Pending Verification' | 'Verified' | 'Rejected' | 'Expired' | 'COD Pending' | 'Completed'
  shippingAddress
  notes?
  createdAt
  updatedAt
  deliveredAt?
}

export interface Address {
  id
  label
  fullName
  phone
  addressLine1
  addressLine2?
  city
  state
  pincode
  landmark?
  isDefault
}

// ==================== CART TYPES ====================
export interface CartItem {
  id
  productId
  product
  quantity
  pricePerUnit
}

export interface Cart {
  items: CartItem[]
  subtotal
  deliveryFee
  tax
  discount
  total
}

export interface Payment {
  paymentId: string
  orderId: string
  buyerId: string
  buyerName?: string
  amount: number
  paymentMethod: 'cod' | 'upi'
  utrNumber?: string
  paymentStatus: 'Pending Payment' | 'Pending Verification' | 'Verified' | 'Rejected' | 'Expired' | 'COD Pending' | 'Completed'
  createdAt: any
  verifiedBy?: string | null
  verifiedAt?: any
  remarks?: string
}

// ==================== INVENTORY TYPES ====================
export interface InventoryItem {
  id
  productId
  productName
  sku
  currentStock
  minStock
  maxStock
  unit
  lastRestocked
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface StockMovement {
  id
  productId
  type: 'in' | 'out' | 'adjustment'
  quantity
  reason
  createdAt
}

// ==================== ANALYTICS TYPES ====================
export interface SalesData {
  date
  revenue
  orders
  avgOrderValue
}

export interface TopProduct {
  productId
  productName
  productImage
  totalSold
  revenue
}

export interface SellerStats {
  totalRevenue
  totalOrders
  totalProducts
  avgRating
  pendingOrders
  completedOrders
  cancelledOrders
  revenueGrowth
  ordersGrowth
}

export interface AdminStats {
  totalUsers
  totalSellers
  totalBuyers
  totalOrders
  totalRevenue
  totalProducts
  pendingKyc
  activePromotions
  usersGrowth
  revenueGrowth
  ordersGrowth
}

// ==================== PROMOTION TYPES ====================
export interface Promotion {
  id
  name
  code
  type: 'percentage' | 'fixed' | 'free_delivery'
  value
  minOrderValue?
  maxDiscount?
  startDate
  endDate
  usageLimit?
  usedCount
  status: 'active' | 'inactive' | 'expired'
  applicableCategories?: string[]
  applicableSellers?: string[]
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id
  userId
  title
  message
  type: 'order' | 'payment' | 'promotion' | 'system'
  isRead
  actionUrl?
  createdAt
}

// ==================== REVIEW TYPES ====================
export interface Review {
  id
  productId
  buyerId
  buyerName
  rating
  comment
  images?: string[]
  createdAt
  sellerReply?
  sellerReplyAt?
}





