/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  IDataObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { SPREEDLY_API_BASE_URL } from '../constants';

/**
 * Makes an authenticated request to the Spreedly API
 */
export async function spreedlyApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query: IDataObject = {},
): Promise<any> {
  const credentials = await this.getCredentials('spreedlyApi');

  const options: IHttpRequestOptions = {
    method,
    url: `${SPREEDLY_API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    auth: {
      username: credentials.environmentKey as string,
      password: credentials.accessSecret as string,
    },
    json: true,
  };

  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  if (Object.keys(query).length > 0) {
    options.qs = query;
  }

  try {
    const response = await this.helpers.httpRequest(options);
    return response;
  } catch (error: any) {
    if (error.response) {
      const errorMessage = error.response.body?.errors?.[0]?.message 
        || error.response.body?.message 
        || error.message;
      throw new NodeApiError(this.getNode(), error, {
        message: `Spreedly API Error: ${errorMessage}`,
        httpCode: error.response.statusCode?.toString(),
      });
    }
    throw error;
  }
}

/**
 * Makes an authenticated request with pagination support
 */
export async function spreedlyApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  propertyName: string,
  body: IDataObject = {},
  query: IDataObject = {},
): Promise<any[]> {
  const returnData: any[] = [];
  let responseData;
  let sinceToken: string | undefined;

  do {
    const paginatedQuery = { ...query };
    if (sinceToken) {
      paginatedQuery.since_token = sinceToken;
    }

    responseData = await spreedlyApiRequest.call(this, method, endpoint, body, paginatedQuery);

    const items = responseData[propertyName];
    if (items && Array.isArray(items)) {
      returnData.push(...items);

      // Get the token from the last item for pagination
      if (items.length > 0) {
        sinceToken = items[items.length - 1].token;
      }
    }

    // Check if there are more pages
    // Spreedly returns fewer items than requested when at the end
  } while (responseData[propertyName]?.length === 20);

  return returnData;
}

/**
 * Validates and formats amount for Spreedly API (expects cents)
 */
export function formatAmountInCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts cents back to decimal amount
 */
export function formatCentsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Builds a credit card payment method object for Spreedly API
 */
export function buildCreditCardPaymentMethod(data: IDataObject): IDataObject {
  return {
    credit_card: {
      number: data.cardNumber,
      month: data.expirationMonth,
      year: data.expirationYear,
      verification_value: data.cvv,
      first_name: data.firstName,
      last_name: data.lastName,
      ...(data.email && { email: data.email }),
      ...(data.address1 && { address1: data.address1 }),
      ...(data.address2 && { address2: data.address2 }),
      ...(data.city && { city: data.city }),
      ...(data.state && { state: data.state }),
      ...(data.zip && { zip: data.zip }),
      ...(data.country && { country: data.country }),
      ...(data.phoneNumber && { phone_number: data.phoneNumber }),
    },
  };
}

/**
 * Builds a bank account payment method object for Spreedly API
 */
export function buildBankAccountPaymentMethod(data: IDataObject): IDataObject {
  return {
    bank_account: {
      bank_routing_number: data.routingNumber,
      bank_account_number: data.accountNumber,
      bank_account_type: data.accountType,
      bank_account_holder_type: data.holderType,
      first_name: data.firstName,
      last_name: data.lastName,
      ...(data.fullName && { full_name: data.fullName }),
    },
  };
}
