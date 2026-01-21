/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { spreedlyApiRequest, spreedlyApiRequestAllItems, buildCreditCardPaymentMethod, buildBankAccountPaymentMethod } from '../../transport';
import { simplifyResponse, prepareOutputData } from '../../utils';
import { PAYMENT_METHOD_TYPES } from '../../constants';

/**
 * Payment Method resource operations
 */
export const paymentMethodOperations = {
  /**
   * Tokenize a new payment method (credit card or bank account)
   */
  async tokenize(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodType = this.getNodeParameter('paymentMethodType', i) as string;

    let paymentMethodData: IDataObject;

    if (paymentMethodType === 'credit_card') {
      const cardData = {
        cardNumber: this.getNodeParameter('cardNumber', i) as string,
        expirationMonth: this.getNodeParameter('expirationMonth', i) as number,
        expirationYear: this.getNodeParameter('expirationYear', i) as number,
        cvv: this.getNodeParameter('cvv', i) as string,
        firstName: this.getNodeParameter('firstName', i) as string,
        lastName: this.getNodeParameter('lastName', i) as string,
        ...this.getNodeParameter('cardAdditionalFields', i) as IDataObject,
      };
      paymentMethodData = buildCreditCardPaymentMethod(cardData);
    } else {
      const bankData = {
        routingNumber: this.getNodeParameter('routingNumber', i) as string,
        accountNumber: this.getNodeParameter('accountNumber', i) as string,
        accountType: this.getNodeParameter('accountType', i) as string,
        holderType: this.getNodeParameter('holderType', i) as string,
        firstName: this.getNodeParameter('firstName', i) as string,
        lastName: this.getNodeParameter('lastName', i) as string,
      };
      paymentMethodData = buildBankAccountPaymentMethod(bankData);
    }

    const body: IDataObject = {
      payment_method: paymentMethodData,
    };

    const response = await spreedlyApiRequest.call(this, 'POST', '/payment_methods.json', body);
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Get a payment method by token
   */
  async get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/payment_methods/${paymentMethodToken}.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'payment_method')]);
  },

  /**
   * List all payment methods
   */
  async list(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      const paymentMethods = await spreedlyApiRequestAllItems.call(
        this,
        'GET',
        '/payment_methods.json',
        'payment_methods',
      );
      return prepareOutputData(paymentMethods);
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await spreedlyApiRequest.call(this, 'GET', '/payment_methods.json');
    const paymentMethods = (response.payment_methods || []).slice(0, limit);
    return prepareOutputData(paymentMethods);
  },

  /**
   * Retain a payment method (prevent automatic deletion)
   */
  async retain(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/payment_methods/${paymentMethodToken}/retain.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Redact (delete) a payment method
   */
  async redact(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

    const body: IDataObject = {};
    if (additionalOptions.removeFromGateway) {
      body.remove_from_gateway = additionalOptions.removeFromGateway;
    }

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/payment_methods/${paymentMethodToken}/redact.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Recache the CVV for a payment method
   */
  async recache(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const cvv = this.getNodeParameter('cvv', i) as string;

    const body: IDataObject = {
      payment_method: {
        credit_card: {
          verification_value: cvv,
        },
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/payment_methods/${paymentMethodToken}/recache.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },

  /**
   * Store a payment method at a specific gateway
   */
  async storeAtGateway(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const paymentMethodToken = this.getNodeParameter('paymentMethodToken', i) as string;
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'POST',
      `/gateways/${gatewayToken}/store.json`,
      {
        transaction: {
          payment_method_token: paymentMethodToken,
        },
      },
    );
    return prepareOutputData([simplifyResponse(response, 'transaction')]);
  },
};

/**
 * Payment Method operation descriptions for n8n UI
 */
export const paymentMethodFields = [
  // Payment Method Type
  {
    displayName: 'Payment Method Type',
    name: 'paymentMethodType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
      },
    },
    options: PAYMENT_METHOD_TYPES.slice(0, 2), // Credit card and bank account only
    default: 'credit_card',
    description: 'Type of payment method to tokenize',
  },
  // Credit Card Fields
  {
    displayName: 'Card Number',
    name: 'cardNumber',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['credit_card'],
      },
    },
    default: '',
    description: 'The credit card number',
  },
  {
    displayName: 'Expiration Month',
    name: 'expirationMonth',
    type: 'number' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['credit_card'],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 12,
    },
    default: 1,
    description: 'Card expiration month (1-12)',
  },
  {
    displayName: 'Expiration Year',
    name: 'expirationYear',
    type: 'number' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['credit_card'],
      },
    },
    default: 2025,
    description: 'Card expiration year (4-digit)',
  },
  {
    displayName: 'CVV',
    name: 'cvv',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize', 'recache'],
        paymentMethodType: ['credit_card'],
      },
    },
    typeOptions: { password: true },
    default: '',
    description: 'Card verification value (3-4 digits)',
  },
  {
    displayName: 'First Name',
    name: 'firstName',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
      },
    },
    default: '',
    description: 'Cardholder or account holder first name',
  },
  {
    displayName: 'Last Name',
    name: 'lastName',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
      },
    },
    default: '',
    description: 'Cardholder or account holder last name',
  },
  // Bank Account Fields
  {
    displayName: 'Routing Number',
    name: 'routingNumber',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['bank_account'],
      },
    },
    default: '',
    description: 'Bank routing number (ABA)',
  },
  {
    displayName: 'Account Number',
    name: 'accountNumber',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['bank_account'],
      },
    },
    typeOptions: { password: true },
    default: '',
    description: 'Bank account number',
  },
  {
    displayName: 'Account Type',
    name: 'accountType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['bank_account'],
      },
    },
    options: [
      { name: 'Checking', value: 'checking' },
      { name: 'Savings', value: 'savings' },
    ],
    default: 'checking',
    description: 'Type of bank account',
  },
  {
    displayName: 'Holder Type',
    name: 'holderType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['bank_account'],
      },
    },
    options: [
      { name: 'Personal', value: 'personal' },
      { name: 'Business', value: 'business' },
    ],
    default: 'personal',
    description: 'Type of account holder',
  },
  // Payment Method Token
  {
    displayName: 'Payment Method Token',
    name: 'paymentMethodToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['get', 'retain', 'redact', 'recache', 'storeAtGateway'],
      },
    },
    default: '',
    description: 'The unique token identifying the payment method',
  },
  // Gateway Token for Store
  {
    displayName: 'Gateway Token',
    name: 'gatewayToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['storeAtGateway'],
      },
    },
    default: '',
    description: 'The gateway to store the payment method at',
  },
  // Return All for List
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
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
        resource: ['paymentMethod'],
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
  // Additional Card Fields
  {
    displayName: 'Additional Fields',
    name: 'cardAdditionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['tokenize'],
        paymentMethodType: ['credit_card'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Email',
        name: 'email',
        type: 'string' as const,
        default: '',
        description: 'Cardholder email address',
      },
      {
        displayName: 'Address Line 1',
        name: 'address1',
        type: 'string' as const,
        default: '',
        description: 'Billing address line 1',
      },
      {
        displayName: 'Address Line 2',
        name: 'address2',
        type: 'string' as const,
        default: '',
        description: 'Billing address line 2',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string' as const,
        default: '',
        description: 'Billing city',
      },
      {
        displayName: 'State',
        name: 'state',
        type: 'string' as const,
        default: '',
        description: 'Billing state/province',
      },
      {
        displayName: 'ZIP/Postal Code',
        name: 'zip',
        type: 'string' as const,
        default: '',
        description: 'Billing ZIP/postal code',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string' as const,
        default: '',
        description: 'Billing country (ISO code)',
      },
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string' as const,
        default: '',
        description: 'Cardholder phone number',
      },
    ],
  },
  // Additional Options for Redact
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection' as const,
    placeholder: 'Add Option',
    displayOptions: {
      show: {
        resource: ['paymentMethod'],
        operation: ['redact'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Remove from Gateway',
        name: 'removeFromGateway',
        type: 'boolean' as const,
        default: false,
        description: 'Whether to also remove the card from the gateway it is stored at',
      },
    ],
  },
];
