// lib/preloaded-templates.js

export const PRELOADED_TEMPLATES = [
  // ==================== 1. ORDERS (1-10) ====================
  {
    name: "Order Placed (Buyer)",
    titleTemplate: "Order Placed Successfully! 🛒",
    bodyTemplate: "Hi {userName}, your order #{orderId} for {productName} has been placed. Amount: ₹{amount}.",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Order Placed (Seller)",
    titleTemplate: "New Order Received! 🌾",
    bodyTemplate: "Hi {sellerName}, you have received a new order #{orderId} for {productName}. Quantity: {quantity}.",
    category: "orders",
    clickAction: "/seller/orders"
  },
  {
    name: "Order Accepted by Farmer",
    titleTemplate: "Farmer Accepted Your Order! ✅",
    bodyTemplate: "Hi {userName}, the farmer {sellerName} has accepted your order #{orderId}. It is now being packed.",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Order Packed & Ready",
    titleTemplate: "Order Packed & Ready! 📦",
    bodyTemplate: "Hi {userName}, your order #{orderId} has been packed by {sellerName} and is waiting for pickup.",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Order Shipped",
    titleTemplate: "Order Shipped! 🚚",
    bodyTemplate: "Hi {userName}, your order #{orderId} of {productName} has been handed over to our delivery partner.",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Order Delivered",
    titleTemplate: "Order Delivered Successfully! 🎉",
    bodyTemplate: "Hi {userName}, your order #{orderId} has been delivered. Enjoy your fresh harvest!",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Order Cancelled by Buyer",
    titleTemplate: "Order Cancelled 🚫",
    bodyTemplate: "Hi {sellerName}, the buyer cancelled order #{orderId} for {productName}.",
    category: "orders",
    clickAction: "/seller/orders"
  },
  {
    name: "Order Cancelled by System",
    titleTemplate: "Order Cancelled automatically",
    bodyTemplate: "Hi {userName}, order #{orderId} has been cancelled because payment verification expired.",
    category: "orders",
    clickAction: "/orders"
  },
  {
    name: "Bulk Order Request Approved",
    titleTemplate: "Bulk Request Approved! 📦",
    bodyTemplate: "Hi {userName}, your wholesale bulk request for {productName} has been approved by {sellerName}.",
    category: "orders",
    clickAction: "/bulk-orders"
  },
  {
    name: "Bulk Order Request Rejected",
    titleTemplate: "Bulk Request Rejected 🚫",
    bodyTemplate: "Hi {userName}, your wholesale bulk request for {productName} was rejected by {sellerName}.",
    category: "orders",
    clickAction: "/bulk-orders"
  },

  // ==================== 2. PAYMENTS (11-20) ====================
  {
    name: "Payment Pending (UPI)",
    titleTemplate: "Complete Your UPI Payment 💳",
    bodyTemplate: "Hi {userName}, order #{orderId} is pending payment. Submit your UTR reference to unlock shipping.",
    category: "payments",
    clickAction: "/orders"
  },
  {
    name: "Payment Approved by Admin",
    titleTemplate: "Payment Verified! 🟢",
    bodyTemplate: "Hi {userName}, your payment of ₹{amount} for order #{orderId} has been successfully verified.",
    category: "payments",
    clickAction: "/orders"
  },
  {
    name: "Payment Rejected (Invalid UTR)",
    titleTemplate: "Payment Rejection Alert 🔴",
    bodyTemplate: "Hi {userName}, payment for order #{orderId} was rejected. Reason: {remarks}. Please resubmit.",
    category: "payments",
    clickAction: "/orders"
  },
  {
    name: "Withdrawal Approved (Seller)",
    titleTemplate: "Withdrawal Successful 💰",
    bodyTemplate: "Hi {sellerName}, your withdrawal request of ₹{amount} has been approved and credited.",
    category: "payments",
    clickAction: "/seller/payments"
  },
  {
    name: "Withdrawal Rejected (Seller)",
    titleTemplate: "Withdrawal Failed ❌",
    bodyTemplate: "Hi {sellerName}, your withdrawal request of ₹{amount} was rejected. Reason: {remarks}.",
    category: "payments",
    clickAction: "/seller/payments"
  },
  {
    name: "Refund Processed",
    titleTemplate: "Refund Processed Successfully",
    bodyTemplate: "Hi {userName}, a refund of ₹{amount} for cancelled order #{orderId} has been processed.",
    category: "payments",
    clickAction: "/orders"
  },
  {
    name: "Deposit Successful",
    titleTemplate: "Deposit Credited! 💸",
    bodyTemplate: "Hi {userName}, a wallet deposit of ₹{amount} has been completed successfully.",
    category: "payments",
    clickAction: "/orders"
  },
  {
    name: "Payout Delay Notification",
    titleTemplate: "Payout Delay Notification ⚠️",
    bodyTemplate: "Hi {sellerName}, your wallet payout of ₹{amount} is delayed due to banking system lag. Expected resolve: 24h.",
    category: "payments",
    clickAction: "/seller/payments"
  },
  {
    name: "COD Cash Collected",
    titleTemplate: "COD Amount Collected 💵",
    bodyTemplate: "Hi {sellerName}, cash on delivery amount of ₹{amount} for order #{orderId} has been collected by delivery partner.",
    category: "payments",
    clickAction: "/seller/payments"
  },
  {
    name: "Refund Initiated",
    titleTemplate: "Refund Initiated for Cancelled Order",
    bodyTemplate: "Hi {userName}, a refund of ₹{amount} has been initiated for order #{orderId} and will reflect in 3-5 days.",
    category: "payments",
    clickAction: "/orders"
  },

  // ==================== 3. DELIVERY UPDATES (21-30) ====================
  {
    name: "Delivery Boy Assigned",
    titleTemplate: "Delivery Partner Assigned 🚚",
    bodyTemplate: "Hi {userName}, delivery partner {driverName} has been assigned to pick up order #{orderId}.",
    category: "deliveries",
    clickAction: "/orders"
  },
  {
    name: "Package Picked Up",
    titleTemplate: "Package Picked Up from Farm 🌾",
    bodyTemplate: "Hi {userName}, driver {driverName} has picked up order #{orderId} from {sellerName}'s farm.",
    category: "deliveries",
    clickAction: "/orders"
  },
  {
    name: "Out For Delivery",
    titleTemplate: "Out for Delivery! 📍",
    bodyTemplate: "Hi {userName}, order #{orderId} is out for delivery. Driver contact: {driverPhone}.",
    category: "deliveries",
    clickAction: "/orders"
  },
  {
    name: "Delivery Delayed",
    titleTemplate: "Delivery Rescheduled ⏰",
    bodyTemplate: "Hi {userName}, delivery of order #{orderId} is delayed due to: {remarks}.",
    category: "deliveries",
    clickAction: "/orders"
  },
  {
    name: "Delivery Address Modified",
    titleTemplate: "Delivery Address Updated 📍",
    bodyTemplate: "Hi {driverName}, delivery address for order #{orderId} has been updated. Please check layout coordinates.",
    category: "deliveries",
    clickAction: "/delivery"
  },
  {
    name: "Cash Delivered to Admin",
    titleTemplate: "COD Cash Deposited ✅",
    bodyTemplate: "Hi {driverName}, your deposit of ₹{amount} collected from deliveries has been verified by admin.",
    category: "deliveries",
    clickAction: "/delivery/wallet"
  },
  {
    name: "Delivery Route Optimized",
    titleTemplate: "Delivery Route Updated 🗺️",
    bodyTemplate: "Hi {driverName}, your delivery schedule route has been optimized for faster dispatch.",
    category: "deliveries",
    clickAction: "/delivery"
  },
  {
    name: "Delivery Returned to Seller",
    titleTemplate: "Shipment Returned to Farmer",
    bodyTemplate: "Hi {sellerName}, order #{orderId} is returned to your farm due to buyer unavailability.",
    category: "deliveries",
    clickAction: "/seller/orders"
  },
  {
    name: "Delivery Rescheduled by Buyer",
    titleTemplate: "Delivery Rescheduled ⏰",
    bodyTemplate: "Hi {driverName}, order #{orderId} delivery date has been rescheduled to tomorrow by the buyer.",
    category: "deliveries",
    clickAction: "/delivery"
  },
  {
    name: "Delivery Verification Required",
    titleTemplate: "OTP Verification Required 🔑",
    bodyTemplate: "Hi {userName}, please share the OTP {otp} with the delivery partner to verify delivery of order #{orderId}.",
    category: "deliveries",
    clickAction: "/orders"
  },

  // ==================== 4. INVENTORY ALERTS (31-40) ====================
  {
    name: "Low Stock Warning (Seller)",
    titleTemplate: "Low Stock Alert! 📦",
    bodyTemplate: "Hi {sellerName}, your product {productName} is running low on stock (Only {stockQty} remaining).",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Out Of Stock (Seller)",
    titleTemplate: "Product Out of Stock 🚫",
    bodyTemplate: "Hi {sellerName}, your product {productName} is now out of stock and unlisted from buyer search.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Item Restocked Alert",
    titleTemplate: "Wishlist Item Restocked! ✨",
    bodyTemplate: "Great news {userName}! {productName} is back in stock at ₹{price}. Buy now before it sells out!",
    category: "inventory",
    clickAction: "/categories"
  },
  {
    name: "Produce Expiry Warning",
    titleTemplate: "Produce Expiry Warning ⏰",
    bodyTemplate: "Hi {sellerName}, your listing for {productName} has been active for {days} days. Review freshness and price.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "High Demand Item Alert",
    titleTemplate: "High demand item warning 🔥",
    bodyTemplate: "Hi {sellerName}, {productName} search volume is up by 40% this week. Increase stock to boost sales.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Price Drop on Wishlist",
    titleTemplate: "Price Drop! 💸",
    bodyTemplate: "Hi {userName}, the price of {productName} on your wishlist has dropped to ₹{price}! Grab it now.",
    category: "inventory",
    clickAction: "/wishlist"
  },
  {
    name: "Unlisted Product Alert",
    titleTemplate: "Listing Unlisted automatically",
    bodyTemplate: "Hi {sellerName}, your product {productName} was unlisted due to high rejection or quality concerns.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Restock Campaign Reminder",
    titleTemplate: "Restock Popular Crops 🌽",
    bodyTemplate: "Hi {sellerName}, buyers in Guntur are looking for {productName}. List your stocks to capture demand.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Price Discrepancy Alert",
    titleTemplate: "Price Review Required ⚠️",
    bodyTemplate: "Hi {sellerName}, the listing price of {productName} is 30% higher than average market rate. Consider revising.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Variant Added Success",
    titleTemplate: "New Variant Added 🌾",
    bodyTemplate: "Hi {sellerName}, variant for {productName} ({weight} kg) is now active and approved.",
    category: "inventory",
    clickAction: "/seller/products"
  },

  // ==================== 5. SELLER MANAGEMENT & KYC (41-48) ====================
  {
    name: "Seller KYC Approved",
    titleTemplate: "KYC Approved! Welcome to KisaNetra 🎉",
    bodyTemplate: "Hi {sellerName}, your verification documents are approved. You can now list produce and trade.",
    category: "account",
    clickAction: "/seller"
  },
  {
    name: "Seller KYC Rejected",
    titleTemplate: "KYC Verification Rejected ❌",
    bodyTemplate: "Hi {sellerName}, your documents were rejected. Reason: {remarks}. Please re-upload to continue.",
    category: "account",
    clickAction: "/seller/kyc"
  },
  {
    name: "Product Listing Approved",
    titleTemplate: "Product Listing Active! 🟢",
    bodyTemplate: "Hi {sellerName}, your listing for {productName} has been approved and is now visible to buyers.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Product Listing Rejected",
    titleTemplate: "Product Listing Rejected 🔴",
    bodyTemplate: "Hi {sellerName}, your product {productName} was rejected. Reason: {remarks}. Revise and re-submit.",
    category: "inventory",
    clickAction: "/seller/products"
  },
  {
    name: "Seller Account Suspended",
    titleTemplate: "Seller Account Suspended ⚠️",
    bodyTemplate: "Hi {sellerName}, your seller privileges are suspended. Reason: {remarks}. Contact Support.",
    category: "account",
    clickAction: "/support"
  },
  {
    name: "Seller Account Activated",
    titleTemplate: "Seller Account Activated! 🎉",
    bodyTemplate: "Hi {sellerName}, your seller privileges have been restored. Welcome back!",
    category: "account",
    clickAction: "/seller"
  },
  {
    name: "Late Dispatch Warning",
    titleTemplate: "Dispatch Warning ⏰",
    bodyTemplate: "Hi {sellerName}, order #{orderId} has been waiting for pickup for over 48 hours. Dispatch immediately.",
    category: "account",
    clickAction: "/seller/orders"
  },
  {
    name: "Farmer Star Awarded",
    titleTemplate: "Star Farmer Badge Awarded! ⭐️",
    bodyTemplate: "Congratulations {sellerName}! You have received the Star Farmer badge for 98% positive reviews.",
    category: "account",
    clickAction: "/seller"
  },

  // ==================== 6. SUPPORT & COMPLIANCE (49-55) ====================
  {
    name: "Support Ticket Opened",
    titleTemplate: "Support Ticket Registered 🎧",
    bodyTemplate: "Hi {userName}, your inquiry #{ticketId} is logged. Our executive will respond within 4 hours.",
    category: "account",
    clickAction: "/support"
  },
  {
    name: "Support Agent Replied",
    titleTemplate: "New Response from Support 💬",
    bodyTemplate: "Hi {userName}, we have responded to your ticket #{ticketId}. Tap to view remarks.",
    category: "account",
    clickAction: "/support"
  },
  {
    name: "Support Ticket Resolved",
    titleTemplate: "Ticket Resolved ✅",
    bodyTemplate: "Hi {userName}, your support inquiry #{ticketId} has been marked as resolved. Tap to rate agent.",
    category: "account",
    clickAction: "/support"
  },
  {
    name: "Support Ticket Escalated",
    titleTemplate: "Ticket Escalated ⚡",
    bodyTemplate: "Hi {userName}, ticket #{ticketId} has been escalated to senior management. Resolution time: 12h.",
    category: "account",
    clickAction: "/support"
  },
  {
    name: "Terms of Service Update",
    titleTemplate: "Terms & Policies Update 📄",
    bodyTemplate: "We have updated our terms and pricing policies for buyers and sellers. Review changes here.",
    category: "account",
    clickAction: "/coming-soon"
  },

  // ==================== 7. PROMOTIONS & ENGAGEMENT (56-65) ====================
  {
    name: "Abandon Cart Discount",
    titleTemplate: "Items waiting in your cart! 🛍️",
    bodyTemplate: "Hi {userName}, complete your checkout for {productName} now and get ₹100 off using code CROP100.",
    category: "promotions",
    clickAction: "/cart"
  },
  {
    name: "Seasonal Harvest Launch",
    titleTemplate: "Monsoon Harvest Launch! 🌾",
    bodyTemplate: "Fresh organic mangoes and tomatoes are now direct from Guntur farms. Shop directly now!",
    category: "promotions",
    clickAction: "/categories"
  },
  {
    name: "Refer a Farmer Campaign",
    titleTemplate: "Refer a Farmer, Earn ₹500! 🤝",
    bodyTemplate: "Invite fellow farmers to sell on KisaNetra. Get ₹500 wallet balance on their first sale.",
    category: "promotions",
    clickAction: "/profile"
  },
  {
    name: "Review Request",
    titleTemplate: "Rate Your Fresh Produce! ⭐️",
    bodyTemplate: "Hi {userName}, how were the fresh crops from {sellerName}? Tap to leave a quick rating & review.",
    category: "promotions",
    clickAction: "/orders"
  },
  {
    name: "Free Delivery Weekend",
    titleTemplate: "Free Delivery Weekend! 🚚💨",
    bodyTemplate: "Get absolute free shipping on all orders this Saturday & Sunday. No minimum purchase required!",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Organic Fertilizers discount",
    titleTemplate: "Organic Fertilizers sale 🌱",
    bodyTemplate: "Hi {sellerName}, get up to 30% off on premium organic compost and natural pest controls.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Welcome Coupon Discount",
    titleTemplate: "Welcome Coupon code active! 🎁",
    bodyTemplate: "Hi {userName}, get 10% discount on your first order. Use code KISAN10 at checkout page.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Seeds Rebate Program",
    titleTemplate: "Premium Seeds Rebate active 🌾",
    bodyTemplate: "Hi {sellerName}, buy premium crop seeds this week and get 15% cashback in your wallet.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "User Reactivation Offer",
    titleTemplate: "We miss you, {userName}! 💔",
    bodyTemplate: "It has been a while since your last fresh harvest order. Get 15% off today using code WEBACK15.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Buyer Loyalty milestone",
    titleTemplate: "Loyalty Reward unlocked! 🏆",
    bodyTemplate: "Hi {userName}, you have completed 10 orders this month! A premium gift voucher is added to your profile.",
    category: "promotions",
    clickAction: "/profile"
  },

  // ==================== 8. PLATFORM ANNOUNCEMENTS (66-72) ====================
  {
    name: "System Maintenance Schedule",
    titleTemplate: "Upcoming System Maintenance ⚙️",
    bodyTemplate: "KisaNetra services will be offline for maintenance on Sunday 2:00 AM to 4:00 AM. Plan accordingly.",
    category: "promotions",
    clickAction: "/coming-soon"
  },
  {
    name: "Severe Weather Warning",
    titleTemplate: "Weather warning: Logistics Delay 🌦️",
    bodyTemplate: "Severe monsoon alerts in Andhra Pradesh. Orders may experience delivery delays of 24-48 hours.",
    category: "promotions",
    clickAction: "/coming-soon"
  },
  {
    name: "PWA New Version Launch",
    titleTemplate: "App Update Available! 📱",
    bodyTemplate: "A new version of KisaNetra is ready with faster deep links and offline payment history. Update now.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Logistics Hub Expansion",
    titleTemplate: "New Delivery Locations Active! 🗺️",
    bodyTemplate: "We have expanded logistics services to 15 new rural hubs. Delivery is now faster in Vijayawada region.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Farmer Training seminar",
    titleTemplate: "Organic Farming Webinar 🌾",
    bodyTemplate: "Hi {sellerName}, register for our free online seminar on natural pest management this Friday 4:00 PM.",
    category: "promotions",
    clickAction: "/"
  },
  {
    name: "Holiday Schedule Warning",
    titleTemplate: "Diwali Delivery Schedule 🏮",
    bodyTemplate: "Logistics services will be offline on Diwali day. Deliveries will resume from the following day.",
    category: "promotions",
    clickAction: "/coming-soon"
  },
  {
    name: "Annual Market report",
    titleTemplate: "2025 Farmer Trade Report 📄",
    bodyTemplate: "KisaNetra annual stats report is out. Read insights on crop pricing and buyer trends in 2025.",
    category: "promotions",
    clickAction: "/"
  }
]
