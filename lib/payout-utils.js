/**
 * Centralized utility for marketplace payout calculations.
 * Standardizes how fees and payouts are calculated across Admin and Seller dashboards.
 */

export const PLATFORM_FEE_RATE = 0.05; // 5%

export function calculatePayoutBreakdown(subtotal) {
  const amount = Number(subtotal) || 0;
  
  // Calculate platform fee first and round it
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  
  // Seller payout is the remainder
  const sellerPayout = amount - platformFee;
  
  return {
    subtotal: amount,
    platformFee,
    sellerPayout
  };
}
