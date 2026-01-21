/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { LICENSING_NOTICE } from '../constants';

let licensingNoticeDisplayed = false;

/**
 * Displays the licensing notice once per node load
 */
export function displayLicensingNotice(): void {
  if (!licensingNoticeDisplayed) {
    console.warn(LICENSING_NOTICE);
    licensingNoticeDisplayed = true;
  }
}

/**
 * Simplifies the response from Spreedly API for cleaner output
 */
export function simplifyResponse(data: IDataObject, type: string): IDataObject {
  // Extract the main object from response wrappers
  if (data[type]) {
    return data[type] as IDataObject;
  }
  return data;
}

/**
 * Prepares execution data with proper structure
 */
export function prepareOutputData(items: IDataObject[]): INodeExecutionData[] {
  return items.map((item) => ({
    json: item,
  }));
}

/**
 * Validates a Spreedly token format
 */
export function isValidToken(token: string): boolean {
  // Spreedly tokens are alphanumeric strings, typically 22+ characters
  return /^[A-Za-z0-9]{10,}$/.test(token);
}

/**
 * Validates credit card number using Luhn algorithm
 */
export function isValidCreditCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validates expiration date
 */
export function isValidExpirationDate(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) {
    return false;
  }

  // Convert 2-digit year to 4-digit if necessary
  const fullYear = year < 100 ? 2000 + year : year;

  if (fullYear < currentYear) {
    return false;
  }

  if (fullYear === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validates CVV format
 */
export function isValidCvv(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Masks a credit card number for display
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    return cardNumber;
  }
  return `****${digits.slice(-4)}`;
}

/**
 * Formats error messages for user display
 */
export function formatErrorMessage(error: any): string {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => e.message || e).join('; ');
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Parses webhook payload to extract relevant data
 */
export function parseWebhookPayload(body: IDataObject): IDataObject {
  // Spreedly webhook payloads contain transaction or payment_method data
  const eventData: IDataObject = {
    receivedAt: new Date().toISOString(),
  };

  if (body.transaction) {
    eventData.type = 'transaction';
    eventData.data = body.transaction;
  } else if (body.payment_method) {
    eventData.type = 'payment_method';
    eventData.data = body.payment_method;
  } else if (body.gateway) {
    eventData.type = 'gateway';
    eventData.data = body.gateway;
  } else if (body.receiver) {
    eventData.type = 'receiver';
    eventData.data = body.receiver;
  } else if (body.certificate) {
    eventData.type = 'certificate';
    eventData.data = body.certificate;
  } else {
    eventData.type = 'unknown';
    eventData.data = body;
  }

  return eventData;
}

/**
 * Converts snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Deep converts object keys from snake_case to camelCase
 */
export function convertKeysToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result: any, key) => {
      result[snakeToCamel(key)] = convertKeysToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

/**
 * Deep converts object keys from camelCase to snake_case
 */
export function convertKeysToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result: any, key) => {
      result[camelToSnake(key)] = convertKeysToSnake(obj[key]);
      return result;
    }, {});
  }
  return obj;
}
