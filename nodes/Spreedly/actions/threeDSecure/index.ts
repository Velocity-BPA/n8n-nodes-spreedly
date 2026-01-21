/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { spreedlyApiRequest, formatAmountInCents } from '../../transport';
import { simplifyResponse, prepareOutputData } from '../../utils';
import { CURRENCY_CODES, THREE_D_SECURE_VERSIONS } from '../../constants';

/**
 * 3D Secure resource operations
 */
export const threeDSecureOperations = {
  /**
   * Initialize a 3D Secure authentication
   */
  async initialize(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const amount = this.getNodeParameter('amount', i) as number;
    const currency = this.getNodeParameter('currency', i) as string;
    const redirectUrl = this.getNodeParameter('redirectUrl', i) as string;
    const additionalFields = this.getNodeParameter('threeDSAdditionalFields', i, {}) as IDataObject;

    const body: IDataObject = {
      transaction: {
        payment_method_token: paymentMethodToken,
        amount: formatAmountInCents(amount),
        currency_code: currency,
        redirect_url: redirectUrl,
        callback_url: additionalFields.callbackUrl || redirectUrl,
        three_ds_version: additionalFields.threeDsVersion || '2',
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/initialize_3ds.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Complete a 3D Secure authentication after challenge
   */
  async complete(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/complete.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Lookup 3D Secure enrollment status
   */
  async lookup(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
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
      `/gateways/${gatewayToken}/lookup_3ds.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Get status of a 3D Secure transaction
   */
  async getStatus(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/transactions/${transactionToken}.json`,
    );

    const transaction = simplifyResponse(response, 'transaction') as IDataObject;
    
    // Extract 3DS-specific information
    const threeDSStatus: IDataObject = {
      token: transaction.token,
      state: transaction.state,
      succeeded: transaction.succeeded,
      three_ds_context: transaction.three_ds_context,
      required_action: transaction.required_action,
      device_fingerprint_url: transaction.device_fingerprint_url,
      challenge_url: transaction.challenge_url,
      acs_url: transaction.acs_url,
    };

    return prepareOutputData([threeDSStatus]);
  },

  /**
   * Submit device fingerprint results for 3DS2
   */
  async submitFingerprint(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;
    const fingerprintResult = this.getNodeParameter('fingerprintResult', i) as string;

    const body: IDataObject = {
      transaction: {
        three_ds_context: fingerprintResult,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/continue.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Submit challenge response for 3DS
   */
  async submitChallenge(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const transactionToken = this.getNodeParameter('transactionToken', i) as string;
    const paRes = this.getNodeParameter('paRes', i, '') as string;
    const md = this.getNodeParameter('md', i, '') as string;

    const body: IDataObject = {
      transaction: {},
    };

    if (paRes) {
      (body.transaction as IDataObject).pares = paRes;
    }
    if (md) {
      (body.transaction as IDataObject).md = md;
    }

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/transactions/${transactionToken}/continue.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },
};

/**
 * 3D Secure operation descriptions for n8n UI
 */
export const threeDSecureFields = [
  // Gateway Token
  {
    displayName: 'Gateway Token',
    name: 'gatewayToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize', 'lookup'],
      },
    },
    default: '',
    description: 'The 3DS-capable gateway to use',
  },
  // Payment Method Token
  {
    displayName: 'Payment Method Token',
    name: 'paymentMethodToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize', 'lookup'],
      },
    },
    default: '',
    description: 'The tokenized card to authenticate',
  },
  // Amount
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize', 'lookup'],
      },
    },
    typeOptions: {
      minValue: 0.01,
      numberPrecision: 2,
    },
    default: 1.00,
    description: 'Transaction amount for 3DS challenge',
  },
  // Currency
  {
    displayName: 'Currency',
    name: 'currency',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize', 'lookup'],
      },
    },
    options: CURRENCY_CODES,
    default: 'USD',
    description: 'Currency code for the transaction',
  },
  // Redirect URL
  {
    displayName: 'Redirect URL',
    name: 'redirectUrl',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize'],
      },
    },
    default: '',
    description: 'URL to redirect the user after 3DS authentication',
  },
  // Transaction Token
  {
    displayName: 'Transaction Token',
    name: 'transactionToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['complete', 'getStatus', 'submitFingerprint', 'submitChallenge'],
      },
    },
    default: '',
    description: 'The 3DS transaction token',
  },
  // Fingerprint Result
  {
    displayName: 'Fingerprint Result',
    name: 'fingerprintResult',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['submitFingerprint'],
      },
    },
    default: '',
    description: 'The device fingerprint result from the browser',
  },
  // PARes (for 3DS1)
  {
    displayName: 'PARes',
    name: 'paRes',
    type: 'string' as const,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['submitChallenge'],
      },
    },
    default: '',
    description: 'Payer Authentication Response from 3DS challenge',
  },
  // MD (for 3DS1)
  {
    displayName: 'MD',
    name: 'md',
    type: 'string' as const,
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['submitChallenge'],
      },
    },
    default: '',
    description: 'Merchant Data from 3DS challenge',
  },
  // Additional 3DS Fields
  {
    displayName: 'Additional Fields',
    name: 'threeDSAdditionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['threeDSecure'],
        operation: ['initialize'],
      },
    },
    default: {},
    options: [
      {
        displayName: '3DS Version',
        name: 'threeDsVersion',
        type: 'options' as const,
        options: THREE_D_SECURE_VERSIONS,
        default: '2',
        description: 'Version of 3D Secure to use',
      },
      {
        displayName: 'Callback URL',
        name: 'callbackUrl',
        type: 'string' as const,
        default: '',
        description: 'URL for 3DS callback (defaults to redirect URL)',
      },
      {
        displayName: 'Browser Info',
        name: 'browser_info',
        type: 'json' as const,
        default: '{}',
        description: 'Browser information for 3DS2 (JSON object)',
      },
    ],
  },
];
