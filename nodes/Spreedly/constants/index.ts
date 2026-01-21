/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Spreedly API base URL
 */
export const SPREEDLY_API_BASE_URL = 'https://core.spreedly.com/v1';

/**
 * Supported payment gateway types in Spreedly
 */
export const GATEWAY_TYPES = [
  { name: 'Stripe', value: 'stripe' },
  { name: 'Braintree', value: 'braintree' },
  { name: 'Adyen', value: 'adyen' },
  { name: 'Authorize.Net', value: 'authorize_net' },
  { name: 'PayPal Commerce Platform', value: 'paypal_commerce_platform' },
  { name: 'Checkout.com', value: 'checkout_v2' },
  { name: 'Worldpay', value: 'worldpay' },
  { name: 'CyberSource', value: 'cyber_source' },
  { name: 'Square', value: 'square_v2' },
  { name: 'NMI', value: 'nmi' },
  { name: 'Payeezy', value: 'payeezy' },
  { name: 'BlueSnap', value: 'blue_snap' },
  { name: 'PayU', value: 'payu' },
  { name: 'Merchant e-Solutions', value: 'merchant_esolutions' },
  { name: 'Paysafe', value: 'paysafe' },
  { name: 'Global Payments', value: 'global_payments' },
  { name: 'Payflow Pro', value: 'payflow_pro' },
  { name: 'USA ePay', value: 'usa_epay' },
  { name: 'Vantiv', value: 'vantiv' },
  { name: 'First Data', value: 'first_data' },
  { name: 'Trust Commerce', value: 'trust_commerce' },
  { name: 'CardConnect', value: 'card_connect' },
  { name: 'Litle', value: 'litle' },
  { name: 'Orbital', value: 'orbital' },
  { name: 'Elavon', value: 'elavon' },
  { name: 'Wirecard', value: 'wirecard' },
  { name: 'PayTrace', value: 'pay_trace' },
  { name: 'Priority Payment Systems', value: 'priority_payment_systems' },
  { name: 'Fat Zebra', value: 'fat_zebra' },
  { name: 'Pin Payments', value: 'pin' },
  { name: 'SecurionPay', value: 'securionpay' },
  { name: 'PayGate', value: 'paygate' },
  { name: 'Beanstream', value: 'beanstream' },
  { name: 'QuickPay', value: 'quickpay_v10' },
  { name: 'eWAY', value: 'eway_rapid' },
  { name: 'Mollie', value: 'mollie' },
  { name: 'Monei', value: 'monei' },
  { name: 'PayJunction', value: 'pay_junction' },
  { name: 'Rapyd', value: 'rapyd' },
  { name: 'DataCash', value: 'data_cash' },
  { name: 'Test', value: 'test' },
];

/**
 * Credit card types
 */
export const CARD_TYPES = [
  { name: 'Visa', value: 'visa' },
  { name: 'Mastercard', value: 'master' },
  { name: 'American Express', value: 'american_express' },
  { name: 'Discover', value: 'discover' },
  { name: 'JCB', value: 'jcb' },
  { name: 'Diners Club', value: 'diners_club' },
  { name: 'Maestro', value: 'maestro' },
];

/**
 * Payment method types
 */
export const PAYMENT_METHOD_TYPES = [
  { name: 'Credit Card', value: 'credit_card' },
  { name: 'Bank Account', value: 'bank_account' },
  { name: 'Apple Pay', value: 'apple_pay' },
  { name: 'Google Pay', value: 'google_pay' },
  { name: 'Third Party Token', value: 'third_party_token' },
];

/**
 * Transaction states
 */
export const TRANSACTION_STATES = [
  'succeeded',
  'pending',
  'failed',
  'gateway_processing_failed',
  'gateway_processing_result_unknown',
];

/**
 * Currency codes (ISO 4217)
 */
export const CURRENCY_CODES = [
  { name: 'US Dollar (USD)', value: 'USD' },
  { name: 'Euro (EUR)', value: 'EUR' },
  { name: 'British Pound (GBP)', value: 'GBP' },
  { name: 'Canadian Dollar (CAD)', value: 'CAD' },
  { name: 'Australian Dollar (AUD)', value: 'AUD' },
  { name: 'Japanese Yen (JPY)', value: 'JPY' },
  { name: 'Swiss Franc (CHF)', value: 'CHF' },
  { name: 'Chinese Yuan (CNY)', value: 'CNY' },
  { name: 'Indian Rupee (INR)', value: 'INR' },
  { name: 'Mexican Peso (MXN)', value: 'MXN' },
  { name: 'Brazilian Real (BRL)', value: 'BRL' },
  { name: 'Singapore Dollar (SGD)', value: 'SGD' },
  { name: 'Hong Kong Dollar (HKD)', value: 'HKD' },
  { name: 'New Zealand Dollar (NZD)', value: 'NZD' },
  { name: 'Swedish Krona (SEK)', value: 'SEK' },
  { name: 'Norwegian Krone (NOK)', value: 'NOK' },
  { name: 'Danish Krone (DKK)', value: 'DKK' },
  { name: 'South African Rand (ZAR)', value: 'ZAR' },
  { name: 'Polish Zloty (PLN)', value: 'PLN' },
  { name: 'Thai Baht (THB)', value: 'THB' },
];

/**
 * 3D Secure versions
 */
export const THREE_D_SECURE_VERSIONS = [
  { name: '3DS 1.0', value: '1' },
  { name: '3DS 2.0', value: '2' },
];

/**
 * Webhook event types
 */
export const WEBHOOK_EVENT_TYPES = [
  { name: 'Transaction - Succeeded', value: 'transaction.succeeded' },
  { name: 'Transaction - Failed', value: 'transaction.failed' },
  { name: 'Transaction - Pending', value: 'transaction.pending' },
  { name: 'Payment Method - Added', value: 'payment_method.added' },
  { name: 'Payment Method - Retained', value: 'payment_method.retained' },
  { name: 'Payment Method - Redacted', value: 'payment_method.redacted' },
  { name: 'Payment Method - Updated', value: 'payment_method.updated' },
  { name: 'Gateway - Added', value: 'gateway.added' },
  { name: 'Gateway - Redacted', value: 'gateway.redacted' },
  { name: 'Gateway - Retained', value: 'gateway.retained' },
  { name: 'Receiver - Added', value: 'receiver.added' },
  { name: 'Receiver - Redacted', value: 'receiver.redacted' },
  { name: 'Certificate - Added', value: 'certificate.added' },
];

/**
 * API response success indicators
 */
export const SUCCESS_STATES = ['succeeded', 'retained', 'redacted', 'created'];

/**
 * Licensing notice for runtime logs (displayed once per node load)
 */
export const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;
