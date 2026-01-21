/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  isValidToken,
  isValidCreditCardNumber,
  isValidExpirationDate,
  isValidCvv,
  maskCardNumber,
  snakeToCamel,
  camelToSnake,
  parseWebhookPayload,
} from '../../nodes/Spreedly/utils';

import {
  formatAmountInCents,
  formatCentsToAmount,
  buildCreditCardPaymentMethod,
  buildBankAccountPaymentMethod,
} from '../../nodes/Spreedly/transport';

describe('Spreedly Utilities', () => {
  describe('isValidToken', () => {
    it('should validate correct Spreedly tokens', () => {
      expect(isValidToken('AbCd1234567890EfGh')).toBe(true);
      expect(isValidToken('XYZABC123456')).toBe(true);
    });

    it('should reject invalid tokens', () => {
      expect(isValidToken('short')).toBe(false);
      expect(isValidToken('has-special-chars!')).toBe(false);
      expect(isValidToken('')).toBe(false);
    });
  });

  describe('isValidCreditCardNumber', () => {
    it('should validate correct card numbers (Luhn check)', () => {
      // Test Visa card
      expect(isValidCreditCardNumber('4111111111111111')).toBe(true);
      // Test Mastercard
      expect(isValidCreditCardNumber('5500000000000004')).toBe(true);
    });

    it('should reject invalid card numbers', () => {
      expect(isValidCreditCardNumber('1234567890123456')).toBe(false);
      expect(isValidCreditCardNumber('123')).toBe(false);
      expect(isValidCreditCardNumber('')).toBe(false);
    });
  });

  describe('isValidExpirationDate', () => {
    it('should validate future expiration dates', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(isValidExpirationDate(12, futureYear)).toBe(true);
    });

    it('should reject past expiration dates', () => {
      expect(isValidExpirationDate(1, 2020)).toBe(false);
    });

    it('should reject invalid months', () => {
      expect(isValidExpirationDate(0, 2030)).toBe(false);
      expect(isValidExpirationDate(13, 2030)).toBe(false);
    });
  });

  describe('isValidCvv', () => {
    it('should validate 3-digit CVV', () => {
      expect(isValidCvv('123')).toBe(true);
    });

    it('should validate 4-digit CVV (Amex)', () => {
      expect(isValidCvv('1234')).toBe(true);
    });

    it('should reject invalid CVVs', () => {
      expect(isValidCvv('12')).toBe(false);
      expect(isValidCvv('12345')).toBe(false);
      expect(isValidCvv('abc')).toBe(false);
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card number showing last 4 digits', () => {
      expect(maskCardNumber('4111111111111111')).toBe('****1111');
    });

    it('should handle short numbers', () => {
      expect(maskCardNumber('123')).toBe('123');
    });
  });

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('payment_method_token')).toBe('paymentMethodToken');
      expect(snakeToCamel('gateway_type')).toBe('gatewayType');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('paymentMethodToken')).toBe('payment_method_token');
      expect(camelToSnake('gatewayType')).toBe('gateway_type');
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse transaction webhook', () => {
      const payload = {
        transaction: {
          token: 'txn123',
          succeeded: true,
        },
      };
      const result = parseWebhookPayload(payload);
      expect(result.type).toBe('transaction');
      expect(result.data).toEqual(payload.transaction);
    });

    it('should parse payment method webhook', () => {
      const payload = {
        payment_method: {
          token: 'pm123',
          storage_state: 'retained',
        },
      };
      const result = parseWebhookPayload(payload);
      expect(result.type).toBe('payment_method');
    });

    it('should handle unknown payload types', () => {
      const payload = { unknown_field: 'value' };
      const result = parseWebhookPayload(payload);
      expect(result.type).toBe('unknown');
    });
  });
});

describe('Spreedly Transport', () => {
  describe('formatAmountInCents', () => {
    it('should convert dollars to cents', () => {
      expect(formatAmountInCents(10.00)).toBe(1000);
      expect(formatAmountInCents(10.50)).toBe(1050);
      expect(formatAmountInCents(0.01)).toBe(1);
    });

    it('should handle rounding', () => {
      expect(formatAmountInCents(10.999)).toBe(1100);
    });
  });

  describe('formatCentsToAmount', () => {
    it('should convert cents to dollars', () => {
      expect(formatCentsToAmount(1000)).toBe(10.00);
      expect(formatCentsToAmount(1050)).toBe(10.50);
      expect(formatCentsToAmount(1)).toBe(0.01);
    });
  });

  describe('buildCreditCardPaymentMethod', () => {
    it('should build credit card object', () => {
      const data = {
        cardNumber: '4111111111111111',
        expirationMonth: 12,
        expirationYear: 2025,
        cvv: '123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = buildCreditCardPaymentMethod(data);
      
      expect(result.credit_card).toBeDefined();
      expect((result.credit_card as any).number).toBe('4111111111111111');
      expect((result.credit_card as any).month).toBe(12);
      expect((result.credit_card as any).year).toBe(2025);
      expect((result.credit_card as any).first_name).toBe('John');
    });

    it('should include optional fields when provided', () => {
      const data = {
        cardNumber: '4111111111111111',
        expirationMonth: 12,
        expirationYear: 2025,
        cvv: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        city: 'New York',
      };
      const result = buildCreditCardPaymentMethod(data);
      
      expect((result.credit_card as any).email).toBe('john@example.com');
      expect((result.credit_card as any).city).toBe('New York');
    });
  });

  describe('buildBankAccountPaymentMethod', () => {
    it('should build bank account object', () => {
      const data = {
        routingNumber: '021000021',
        accountNumber: '9876543210',
        accountType: 'checking',
        holderType: 'personal',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = buildBankAccountPaymentMethod(data);
      
      expect(result.bank_account).toBeDefined();
      expect((result.bank_account as any).bank_routing_number).toBe('021000021');
      expect((result.bank_account as any).bank_account_number).toBe('9876543210');
      expect((result.bank_account as any).bank_account_type).toBe('checking');
    });
  });
});

describe('Constants', () => {
  it('should have valid gateway types', () => {
    const { GATEWAY_TYPES } = require('../../nodes/Spreedly/constants');
    expect(GATEWAY_TYPES.length).toBeGreaterThan(0);
    expect(GATEWAY_TYPES.find((g: any) => g.value === 'stripe')).toBeDefined();
    expect(GATEWAY_TYPES.find((g: any) => g.value === 'braintree')).toBeDefined();
  });

  it('should have valid currency codes', () => {
    const { CURRENCY_CODES } = require('../../nodes/Spreedly/constants');
    expect(CURRENCY_CODES.length).toBeGreaterThan(0);
    expect(CURRENCY_CODES.find((c: any) => c.value === 'USD')).toBeDefined();
  });

  it('should have licensing notice', () => {
    const { LICENSING_NOTICE } = require('../../nodes/Spreedly/constants');
    expect(LICENSING_NOTICE).toContain('Velocity BPA');
    expect(LICENSING_NOTICE).toContain('Business Source License 1.1');
  });
});
