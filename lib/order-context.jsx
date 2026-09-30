'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  increment,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore'
import { useProducts } from './product-context'
import { useNotifications } from './notification-context'

const OrderContext = createContext(undefined)

export function OrderProvider({ children }) {
  const { decreaseStock } = useProducts()
  const { sendMultiChannelNotification } = useNotifications()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time listener for orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const orderList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Handle Firestore timestamps properly
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
          };
        });
        setOrders(orderList);

        setLoading(false);
      },
      (error) => {
        console.error("Orders sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addOrder = useCallback(async (orderData) => {
    try {
      const orderNumber = `AGR-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        orderNumber,
        createdAt: serverTimestamp(),
        orderStatus: 'placed',
        paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'cod' ? 'COD Pending' : 'Pending Verification'),
        updatedAt: serverTimestamp()
      });

      await sendMultiChannelNotification({
        recipientId: orderData.sellerId,
        title: "New Order Placed",
        message: `A new order ${orderNumber} for ₹${orderData.amount} has been placed.`,
        type: 'orders',
        priority: 'Medium',
        clickAction: '/seller/orders'
      });

      // Automatically decrease stock for each item (if multiple) or single product
      if (orderData.items) {
        for (const item of orderData.items) {
          const productId = item.productId || item.id;
          if (productId) {
            await decreaseStock(productId, item.quantity, item.sellerId, item.name || item.productName, item.variantId, item.variantWeight || 1);
          }
        }
      } else if (orderData.productId) {
         await decreaseStock(orderData.productId, 1, orderData.sellerId, orderData.productName);
      }

      return { id: docRef.id, orderNumber };
    } catch (error) {
      console.error("Error adding order:", error);
      throw error;
    }
  }, [decreaseStock])

  const updateOrderStatus = useCallback(async (orderId, orderStatus, extraData = {}) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updatePayload = {
        orderStatus,
        updatedAt: serverTimestamp(),
        ...extraData
      };
      
      await updateDoc(orderRef, updatePayload);

      // Trigger status change notifications with enriched dynamic messages
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const sellerName = order.sellerName || order.sellerBusinessName || 'the seller'
        const buyerName = order.buyerName || 'the customer'
        const orderNum = order.orderNumber || orderId.slice(0, 8)
        const amount = order.amount ? `₹${order.amount}` : ''

        if (orderStatus === 'accepted') {
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "✅ Order Accepted",
            message: `${sellerName} accepted your order #${orderNum}.${amount ? ` Total: ${amount}.` : ''} Preparing for dispatch.`,
            type: 'orders',
            priority: 'Medium',
            clickAction: '/orders'
          })
          await sendMultiChannelNotification({
            recipientId: order.sellerId,
            title: "📋 Order Confirmed",
            message: `You accepted order #${orderNum} from ${buyerName}.${amount ? ` Amount: ${amount}.` : ''} Please prepare the items for shipping.`,
            type: 'orders',
            priority: 'Low',
            clickAction: '/seller/orders'
          })
        } else if (orderStatus === 'assigned' && extraData.deliveryBoyId) {
          // Notify delivery partner
          await sendMultiChannelNotification({
            recipientId: extraData.deliveryBoyId,
            title: "🚴 New Delivery Assigned",
            message: `Order #${orderNum} from ${sellerName} is assigned to you for pickup.${amount ? ` COD: ${amount}.` : ''} Proceed to the pickup location.`,
            type: 'deliveries',
            priority: 'High',
            clickAction: '/delivery'
          })
          // Also notify the buyer that a delivery partner is assigned
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "📦 Delivery Partner Assigned",
            message: `A delivery partner has been assigned to your order #${orderNum}. Your order will be picked up from ${sellerName} soon.`,
            type: 'deliveries',
            priority: 'Medium',
            clickAction: '/orders'
          })
        } else if (orderStatus === 'shipped') {
          // NEW: Notify buyer when seller ships the order
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "🚚 Order Shipped",
            message: `Your order #${orderNum} has been packed and shipped by ${sellerName}. It's on its way!`,
            type: 'orders',
            priority: 'High',
            clickAction: '/orders'
          })
        } else if (orderStatus === 'picked_up') {
          // NEW: Notify buyer when delivery partner picks up the order (out for delivery)
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "🛵 Out for Delivery",
            message: `Your order #${orderNum} has been picked up and is now out for delivery. Get ready to receive your fresh produce!`,
            type: 'deliveries',
            priority: 'High',
            clickAction: '/orders'
          })
          await sendMultiChannelNotification({
            recipientId: order.sellerId,
            title: "📤 Order Picked Up",
            message: `Order #${orderNum} for ${buyerName} has been picked up by the delivery partner.`,
            type: 'orders',
            priority: 'Low',
            clickAction: '/seller/orders'
          })
        } else if (orderStatus === 'delivered') {
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "📬 Order Delivered",
            message: `Your order #${orderNum} has been delivered successfully. Enjoy your fresh harvest from ${sellerName}!`,
            type: 'orders',
            priority: 'Critical',
            clickAction: '/orders'
          })
          await sendMultiChannelNotification({
            recipientId: order.sellerId,
            title: "📬 Delivery Complete",
            message: `Order #${orderNum} has been delivered to ${buyerName}.${amount ? ` Payment of ${amount} will be credited to your wallet.` : ''}`,
            type: 'orders',
            priority: 'High',
            clickAction: '/seller/orders'
          })
        } else if (orderStatus === 'cancelled') {
          await sendMultiChannelNotification({
            recipientId: order.buyerId,
            title: "❌ Order Cancelled",
            message: `Your order #${orderNum} from ${sellerName} has been cancelled.${amount ? ` Refund of ${amount} will be processed if applicable.` : ''}`,
            type: 'orders',
            priority: 'High',
            clickAction: '/orders'
          })
          await sendMultiChannelNotification({
            recipientId: order.sellerId,
            title: "❌ Order Cancelled",
            message: `Order #${orderNum} from ${buyerName} has been cancelled.`,
            type: 'orders',
            priority: 'High',
            clickAction: '/seller/orders'
          })
        }
      }

    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }, [orders, sendMultiChannelNotification])

  const acceptOrder = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'accepted')
  }, [updateOrderStatus])

  const assignDeliveryBoy = useCallback(async (orderId, deliveryBoyUid, deliveryBoyId) => {
    await updateOrderStatus(orderId, 'assigned', { 
      deliveryBoyId: deliveryBoyUid, 
      displayDeliveryId: deliveryBoyId || 'PENDING', 
      deliveryStatus: 'assigned' 
    })
  }, [updateOrderStatus])



  const markPickedUp = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'picked_up', { deliveryStatus: 'picked_up' })
  }, [updateOrderStatus])

  const markDelivered = useCallback(async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateOrderStatus(orderId, 'delivered', { 
        deliveryStatus: 'delivered', 
        paymentStatus: 'completed'
      })

      // Credit the delivery boy's wallet (e.g., ₹40 per delivery)
      if (order.deliveryBoyId) {
        const userRef = doc(db, "users", order.deliveryBoyId);
        await updateDoc(userRef, {
          walletBalance: increment(40),
          updatedAt: serverTimestamp()
        });
      }

      // Refer & Earn Reward processing
      if (order.referralDiscountApplied) {
        const referralsRef = collection(db, 'referrals')
        const q = query(
          referralsRef,
          where('refereeId', '==', order.buyerId),
          where('status', '==', 'Registered')
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const referralDoc = snap.docs[0]
          const referralData = referralDoc.data()
          const referrerId = referralData.referrerId
          
          // Fetch dynamic referrerReward
          const settingsSnap = await getDoc(doc(db, 'admin_settings', 'referral'));
          let referrerReward = 100;
          let minOrderValue = 300;
          let isEnabled = true;
          if (settingsSnap.exists()) {
            const settings = settingsSnap.data();
            referrerReward = Number(settings.referrerReward || 100);
            minOrderValue = Number(settings.minOrderValue || 300);
            isEnabled = settings.enabled !== false;
          }

          if (!isEnabled) {
             console.log("Referral program is paused, not crediting reward.");
             return;
          }

          if ((order.subtotal || order.amount) < minOrderValue) {
             console.log(`Order amount ${order.subtotal || order.amount} is below minimum required for referral (${minOrderValue}).`);
             return; // Or we can mark referral as expired/invalid, but for now just don't credit.
          }
          
          // Update referral status to 'credited'
          await updateDoc(doc(db, 'referrals', referralDoc.id), {
            status: 'credited',
            updatedAt: serverTimestamp()
          })
          
          // Credit referrer's walletBalance
          const referrerUserRef = doc(db, "users", referrerId)
          await updateDoc(referrerUserRef, {
            walletBalance: increment(referrerReward),
            updatedAt: serverTimestamp()
          })
          
          // Send a notification to the referrer informing them of their reward
          await sendMultiChannelNotification({
            recipientId: referrerId,
            title: "🎉 Referral Reward Earned!",
            message: `Congratulations! Your friend ${order.buyerName || 'a friend'} placed their first order, and ₹${referrerReward} referral reward has been credited to your wallet.`,
            type: 'promotions',
            priority: 'High',
            clickAction: '/profile'
          })
        }
      }
    } catch (error) {
      console.error("Error marking as delivered:", error);
    }
  }, [updateOrderStatus, orders, sendMultiChannelNotification])


  const cancelOrder = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'cancelled')
  }, [updateOrderStatus])

  const getOrderById = useCallback((id) => {
    return orders.find((o) => o.id === id)
  }, [orders])

  const getOrdersByBuyer = useCallback((buyerId) => {
    return orders.filter(o => o.buyerId === buyerId)
  }, [orders])

  const getOrdersBySeller = useCallback((sellerId) => {
    return orders.filter(o => o.sellerId === sellerId || (o.items && o.items.some(item => item.sellerId === sellerId)))
  }, [orders])

  const getOrdersByDeliveryBoy = useCallback((deliveryBoyId) => {
    return orders.filter(o => o.deliveryBoyId === deliveryBoyId)
  }, [orders])

  const calculateETA = useCallback((status, createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    let etaDate = new Date(createdDate);

    if (status === 'delivered') return "Delivered";
    if (status === 'cancelled') return "Order Cancelled";

    switch(status) {
      case 'placed':
      case 'pending':
        etaDate.setDate(createdDate.getDate() + 3);
        break;
      case 'accepted':
      case 'confirmed':
      case 'processing':
        etaDate.setDate(createdDate.getDate() + 2);
        break;
      case 'assigned':
      case 'shipped':
        etaDate.setDate(createdDate.getDate() + 1);
        break;
      case 'picked_up':
      case 'out_for_delivery':
        return "Arriving Today!";
      default:
        etaDate.setDate(createdDate.getDate() + 3);
    }

    // If ETA is today
    if (etaDate.toDateString() === now.toDateString()) {
      return "Today!";
    }
    
    // If ETA is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (etaDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return etaDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: now.getFullYear() !== etaDate.getFullYear() ? 'numeric' : undefined
    });
  }, [])

  const value = useMemo(() => ({
    orders,
    loading,
    addOrder,
    updateOrderStatus,
    acceptOrder,
    assignDeliveryBoy,
    markPickedUp,
    markDelivered,
    cancelOrder,
    getOrderById,
    getOrdersByBuyer,
    getOrdersBySeller,
    getOrdersByDeliveryBoy,
    calculateETA
  }), [orders, loading, addOrder, updateOrderStatus, acceptOrder, assignDeliveryBoy, markPickedUp, markDelivered, cancelOrder, getOrderById, getOrdersByBuyer, getOrdersBySeller, getOrdersByDeliveryBoy, calculateETA])



  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}
