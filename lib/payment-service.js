// Modular Payment Service
// Easily swap PAYMENT_GATEWAY_CONFIG.activeGateway for 'razorpay' or 'cashfree' later.

export const PAYMENT_GATEWAY_CONFIG = {
  activeGateway: 'manual_upi', // 'manual_upi' | 'razorpay' | 'cashfree' | 'phonepe'
  merchantUpiId: 'kisanetra@upi', // Agricultural merchant VPA
  merchantName: 'KisaNetra Marketplace'
}

/**
 * Generates the standard UPI pay string URI
 */
export function generateUpiUri({ pa = PAYMENT_GATEWAY_CONFIG.merchantUpiId, pn = PAYMENT_GATEWAY_CONFIG.merchantName, am, tn = 'KisaNetra Order Payment' }) {
  const cleanPn = pn.replace(/[^a-zA-Z0-9\s]/g, ''); // URI safe name
  const params = [
    `pa=${pa}`,
    `pn=${encodeURIComponent(cleanPn)}`,
    `am=${parseFloat(am).toFixed(2)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(tn)}`
  ].join('&');
  
  return `upi://pay?${params}`;
}

/**
 * Deep-link schemas for major UPI apps in India
 */
export const UPI_APP_SCHEMES = {
  phonepe: {
    name: 'PhonePe',
    intent: (upiUri) => upiUri.replace('upi://pay', 'phonepe://pay'),
    packageName: 'com.phonepe.app',
    appStoreUrl: 'https://apps.apple.com/in/app/phonepe-upi-payments/id1170342019'
  },
  gpay: {
    name: 'Google Pay',
    intent: (upiUri) => upiUri.replace('upi://pay', 'tez://upi/pay'),
    packageName: 'com.google.android.apps.nbu.paisa.user',
    appStoreUrl: 'https://apps.apple.com/in/app/google-pay/id1193357041'
  },
  paytm: {
    name: 'Paytm',
    intent: (upiUri) => upiUri.replace('upi://pay', 'paytmmp://pay'),
    packageName: 'net.one97.paytm',
    appStoreUrl: 'https://apps.apple.com/in/app/paytm-secure-upi-payments/id473941634'
  },
  bhim: {
    name: 'BHIM UPI',
    intent: (upiUri) => upiUri.replace('upi://pay', 'bhim://pay'),
    packageName: 'in.org.npci.upiapp',
    appStoreUrl: 'https://apps.apple.com/in/app/bhim-making-india-cashless/id1193139612'
  },
  generic: {
    name: 'Any UPI App',
    intent: (upiUri) => upiUri,
    packageName: '',
    appStoreUrl: ''
  }
}
