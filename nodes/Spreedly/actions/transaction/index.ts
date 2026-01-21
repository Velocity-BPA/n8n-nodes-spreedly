/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { spreedlyApiRequest, spreedlyApiRequestAllItems, formatAmountInCents } from '../../transport';
import { simplifyResponse, prepareOutputData } from '../../utils';
import { CURRENCY_CODES } from '../../constants';

/**
 * Transaction resource operations
 */
export const transactionOperations = {
  /**
   * Create a purchase transaction (authorize + capture)
   */
  async purchase(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const amount = this.getNodeParameter('amount', i) as number;
    const currency = this.getNodeParameter('currency', i) as string;
    const additionalFields = this.getNodeParameter('transactionAdditionalFields', i, {}) as IDataObject;

    const body: IDataObject = {
      transaction: {
        payment_method_token: paymentMethodToken,
        amount: formatAmountInCents(amount),
        currency_code: currency,
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/purchase.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Create an authorization (hold funds without capturing)
   */
  async authorize(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const amount = this.getNodeParameter('amount', i) as number;
    const currency = this.getNodeParameter('currency', i) as string;
    const additionalFields = this.getNodeParameter('transactionAdditionalFields', i, {}) as IDataObject;

    const body: IDataObject = {
      transaction: {
        payment_method_token: paymentMethodToken,
        amount: formatAmountInCents(amount),
        currency_code: currency,
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/authorize.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Capture a previously authorized transaction
   */
  async capture(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;
    const captureAmount = this.getNodeParameter('captureAmount', i, null) as number | null;

    const body: IDataObject = {
      transaction: {},
    };

    if (captureAmount !== null && captureAmount > 0) {
      (body.transaction as IDataObject).amount = formatAmountInCents(captureAmount);
    }

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/capture.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Void a transaction (cancel before settlement)
   */
  async void(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/void.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Refund a captured/settled transaction
   */
  async refund(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;
    const refundAmount = this.getNodeParameter('refundAmount', i, null) as number | null;

    const body: IDataObject = {
      transaction: {},
    };

    if (refundAmount !== null && refundAmount > 0) {
      (body.transaction as IDataObject).amount = formatAmountInCents(refundAmount);
    }

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/credit.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Create a general credit (credit not tied to a previous purchase)
   */
  async generalCredit(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const amount = this.getNodeParameter('amount', i) as number;
    const currency = this.getNodeParameter('currency', i) as string;

    const body: IDataObject = {
      transaction: {
        payment_method_token: paymentMethodToken,
        amount: formatAmountInCents(amount),
        currency_code: currency,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/general_credit.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Verify a payment method (zero-value authorization)
   */
  async verify(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const currency = this.getNodeParameter('currency', i) as string;
    const retainOnSuccess = this.getNodeParameter('retainOnSuccess', i, false) as boolean;

    const body: IDataObject = {
      transaction: {
        payment_method_token: paymentMethodToken,
        currency_code: currency,
        retain_on_success: retainOnSuccess,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/verify.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Get a transaction by token
   */
  async get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/transactions/${transactionToken}.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * List transactions
   */
  async list(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      const transactions = await spreedlyApiRequestAllItems.call(
        this,
        'GET',
        '/transactions.json',
        'transactions',
      );
      return prepareOutputData(transactions);
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await spreedlyApiRequest.call(this, 'GET', '/transactions.json');
    const transactions = (response.transactions || []).slice(0, limit);
    return prepareOutputData(transactions);
  },

  /**
   * Get transcript for a transaction (raw gateway request/response)
   */
  async getTranscript(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/transactions/${transactionToken}/transcript`,
    );
    return prepareOutputData([{ transcript: response }]);
  },
};

/**
 * Transaction operation descriptions for n8n UI
 */
export const transactionFields = [
  // Gateway Token
  {
    displayName: 'Gateway Token',
    name: 'gatewayToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['purchase', 'authorize', 'generalCredit', 'verify'],
      },
    },
    default: '',
    description: 'The gateway to process the transaction through',
  },
  // Payment Method Token
  {
    displayName: 'Payment Method Token',
    name: 'paymentMethodToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['purchase', 'authorize', 'generalCredit', 'verify'],
      },
    },
    default: '',
    description: 'The tokenized payment method to charge',
  },
  // Amount
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['purchase', 'authorize', 'generalCredit'],
      },
    },
    typeOptions: {
      minValue: 0.01,
      numberPrecision: 2,
    },
    default: 1.00,
    description: 'Transaction amount in decimal (e.g., 10.50 for $10.50)',
  },
  // Currency
  {
    displayName: 'Currency',
    name: 'currency',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['purchase', 'authorize', 'generalCredit', 'verify'],
      },
    },
    options: CURRENCY_CODES,
    default: 'USD',
    description: 'Currency code for the transaction',
  },
  // Transaction Token
  {
    displayName: 'Transaction Token',
    name: 'transactionToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['capture', 'void', 'refund', 'get', 'getTranscript'],
      },
    },
    default: '',
    description: 'The token of the transaction to operate on',
  },
  // Capture Amount (optional)
  {
    displayName: 'Capture Amount',
    name: 'captureAmount',
    type: 'number' as const,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['capture'],
      },
    },
    typeOptions: {
      minValue: 0.01,
      numberPrecision: 2,
    },
    default: 0,
    description: 'Amount to capture (leave empty or 0 for full amount)',
  },
  // Refund Amount (optional)
  {
    displayName: 'Refund Amount',
    name: 'refundAmount',
    type: 'number' as const,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['refund'],
      },
    },
    typeOptions: {
      minValue: 0.01,
      numberPrecision: 2,
    },
    default: 0,
    description: 'Amount to refund (leave empty or 0 for full amount)',
  },
  // Retain on Success for Verify
  {
    displayName: 'Retain on Success',
    name: 'retainOnSuccess',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['verify'],
      },
    },
    default: false,
    description: 'Whether to retain the payment method if verification succeeds',
  },
  // Return All for List
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['list'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
  },
  // Limit for List
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number' as const,
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 100,
    },
    default: 20,
    description: 'Max number of results to return',
  },
  // Additional Transaction Fields
  {
    displayName: 'Additional Fields',
    name: 'transactionAdditionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['transaction'],
        operation: ['purchase', 'authorize'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Order ID',
        name: 'order_id',
        type: 'string' as const,
        default: '',
        description: 'Your order/invoice ID for reference',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string' as const,
        default: '',
        description: 'Description of the transaction',
      },
      {
        displayName: 'IP Address',
        name: 'ip',
        type: 'string' as const,
        default: '',
        description: 'Customer IP address for fraud prevention',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string' as const,
        default: '',
        description: 'Customer email address',
      },
      {
        displayName: 'Retain on Success',
        name: 'retain_on_success',
        type: 'boolean' as const,
        default: false,
        description: 'Whether to retain the payment method on successful transaction',
      },
    ],
  },
];
