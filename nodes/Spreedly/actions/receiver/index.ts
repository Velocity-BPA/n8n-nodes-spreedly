/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { spreedlyApiRequest, spreedlyApiRequestAllItems } from '../../transport';
import { simplifyResponse, prepareOutputData } from '../../utils';

/**
 * Receiver resource operations (for delivering card data to non-gateway APIs)
 */
export const receiverOperations = {
  /**
   * Create a new receiver
   */
  async create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const receiverType = this.getNodeParameter('receiverType', i) as string;
    const hostnames = this.getNodeParameter('hostnames', i) as string;
    const additionalFields = this.getNodeParameter('receiverAdditionalFields', i, {}) as IDataObject;

    const body: IDataObject = {
      receiver: {
        receiver_type: receiverType,
        hostnames: hostnames,
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(this, 'POST', '/receivers.json', body);
    return prepareOutputData([simplifyResponse(response, 'receiver')]);
  },

  /**
   * Get a receiver by token
   */
  async get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const receiverToken = this.getNodeParameter('receiverToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/receivers/${receiverToken}.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'receiver')]);
  },

  /**
   * List all receivers
   */
  async list(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      const receivers = await spreedlyApiRequestAllItems.call(
        this,
        'GET',
        '/receivers.json',
        'receivers',
      );
      return prepareOutputData(receivers);
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await spreedlyApiRequest.call(this, 'GET', '/receivers.json');
    const receivers = (response.receivers || []).slice(0, limit);
    return prepareOutputData(receivers);
  },

  /**
   * Update a receiver
   */
  async update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const receiverToken = this.getNodeParameter('receiverToken', i) as string;
    const updateFields = this.getNodeParameter('receiverUpdateFields', i) as IDataObject;

    const body: IDataObject = {
      receiver: updateFields,
    };

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/receivers/${receiverToken}.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'receiver')]);
  },

  /**
   * Redact (delete) a receiver
   */
  async redact(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const receiverToken = this.getNodeParameter('receiverToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/receivers/${receiverToken}/redact.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Deliver payment data to a receiver
   */
  async deliver(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const receiverToken = this.getNodeParameter('receiverToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const url = this.getNodeParameter('deliveryUrl', i) as string;
    const httpMethod = this.getNodeParameter('httpMethod', i) as string;
    const headers = this.getNodeParameter('deliveryHeaders', i, {}) as IDataObject;
    const body = this.getNodeParameter('deliveryBody', i, '') as string;

    const deliveryBody: IDataObject = {
      delivery: {
        payment_method_token: paymentMethodToken,
        url: url,
        request_method: httpMethod,
        headers: Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n'),
        body: body,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/receivers/${receiverToken}/deliver.json`,
      deliveryBody,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },
};

/**
 * Receiver operation descriptions for n8n UI
 */
export const receiverFields = [
  // Receiver Type
  {
    displayName: 'Receiver Type',
    name: 'receiverType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['create'],
      },
    },
    options: [
      { name: 'Test', value: 'test' },
      { name: 'Generic', value: 'generic' },
      { name: 'Braintree (Auth.net Data)', value: 'braintree_auth' },
      { name: 'PayPal', value: 'paypal' },
      { name: 'Stripe', value: 'stripe' },
    ],
    default: 'test',
    description: 'The type of receiver to create',
  },
  // Hostnames
  {
    displayName: 'Hostnames',
    name: 'hostnames',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Comma-separated list of hostnames the receiver can deliver to',
    placeholder: 'api.example.com,secure.example.com',
  },
  // Receiver Token
  {
    displayName: 'Receiver Token',
    name: 'receiverToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['get', 'update', 'redact', 'deliver'],
      },
    },
    default: '',
    description: 'The unique token identifying the receiver',
  },
  // Payment Method Token for Deliver
  {
    displayName: 'Payment Method Token',
    name: 'paymentMethodToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['deliver'],
      },
    },
    default: '',
    description: 'The payment method to deliver',
  },
  // Delivery URL
  {
    displayName: 'Delivery URL',
    name: 'deliveryUrl',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['deliver'],
      },
    },
    default: '',
    description: 'The URL to deliver the payment data to',
  },
  // HTTP Method
  {
    displayName: 'HTTP Method',
    name: 'httpMethod',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['deliver'],
      },
    },
    options: [
      { name: 'POST', value: 'post' },
      { name: 'PUT', value: 'put' },
      { name: 'PATCH', value: 'patch' },
    ],
    default: 'post',
    description: 'HTTP method for the delivery request',
  },
  // Delivery Headers
  {
    displayName: 'Headers',
    name: 'deliveryHeaders',
    type: 'fixedCollection' as const,
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['deliver'],
      },
    },
    default: {},
    options: [
      {
        name: 'header',
        displayName: 'Header',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string' as const,
            default: '',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string' as const,
            default: '',
          },
        ],
      },
    ],
    description: 'HTTP headers to include in the delivery request',
  },
  // Delivery Body
  {
    displayName: 'Body',
    name: 'deliveryBody',
    type: 'string' as const,
    typeOptions: {
      rows: 5,
    },
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['deliver'],
      },
    },
    default: '',
    description: 'Request body template. Use {{credit_card_number}} for card number placeholders.',
  },
  // Return All for List
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['receiver'],
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
        resource: ['receiver'],
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
  // Additional Fields for Create
  {
    displayName: 'Additional Fields',
    name: 'receiverAdditionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Credentials',
        name: 'credentials',
        type: 'json' as const,
        default: '{}',
        description: 'Credentials for the receiver (JSON object)',
      },
    ],
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'receiverUpdateFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['receiver'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Hostnames',
        name: 'hostnames',
        type: 'string' as const,
        default: '',
        description: 'Comma-separated list of hostnames',
      },
      {
        displayName: 'Credentials',
        name: 'credentials',
        type: 'json' as const,
        default: '{}',
        description: 'Updated credentials (JSON object)',
      },
    ],
  },
];
