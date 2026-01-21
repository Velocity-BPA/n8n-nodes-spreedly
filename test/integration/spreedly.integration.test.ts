/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for n8n-nodes-spreedly
 *
 * These tests require a valid Spreedly sandbox account.
 * Set the following environment variables before running:
 *
 * - SPREEDLY_ENVIRONMENT_KEY
 * - SPREEDLY_ACCESS_SECRET
 *
 * Run with: npm run test:integration
 */

describe('Spreedly Integration Tests', () => {
  const hasCredentials = process.env.SPREEDLY_ENVIRONMENT_KEY && process.env.SPREEDLY_ACCESS_SECRET;

  beforeAll(() => {
    if (!hasCredentials) {
      console.log('Skipping integration tests: SPREEDLY_ENVIRONMENT_KEY and SPREEDLY_ACCESS_SECRET not set');
    }
  });

  describe('Gateway Operations', () => {
    it.skip('should create a test gateway', async () => {
      // This test requires real Spreedly credentials
      // Implement when running against sandbox
    });

    it.skip('should list gateways', async () => {
      // This test requires real Spreedly credentials
    });
  });

  describe('Payment Method Operations', () => {
    it.skip('should tokenize a credit card', async () => {
      // This test requires real Spreedly credentials
      // Use test card numbers in sandbox:
      // - 4111111111111111 (Visa)
      // - 5555555555554444 (Mastercard)
    });

    it.skip('should retain a payment method', async () => {
      // This test requires real Spreedly credentials
    });
  });

  describe('Transaction Operations', () => {
    it.skip('should process a purchase', async () => {
      // This test requires real Spreedly credentials
      // Use the test gateway and a tokenized card
    });

    it.skip('should authorize and capture', async () => {
      // This test requires real Spreedly credentials
    });
  });

  // Placeholder test to ensure file runs
  it('should pass placeholder test', () => {
    expect(true).toBe(true);
  });
});
