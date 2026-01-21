/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { spreedlyApiRequest, spreedlyApiRequestAllItems } from '../../transport';
import { simplifyResponse, prepareOutputData } from '../../utils';
import { GATEWAY_TYPES } from '../../constants';

/**
 * Gateway resource operations
 */
export const gatewayOperations = {
  /**
   * Create a new gateway
   */
  async create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayType = this.getNodeParameter('gatewayType', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    const body: IDataObject = {
      gateway: {
        gateway_type: gatewayType,
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(this, 'POST', '/gateways.json', body);
    return prepareOutputData([simplifyResponse(response, 'gateway')]);
  },

  /**
   * Get a gateway by token
   */
  async get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/gateways/${gatewayToken}.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'gateway')]);
  },

  /**
   * List all gateways
   */
  async list(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      const gateways = await spreedlyApiRequestAllItems.call(
        this,
        'GET',
        '/gateways.json',
        'gateways',
      );
      return prepareOutputData(gateways);
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await spreedlyApiRequest.call(this, 'GET', '/gateways.json');
    const gateways = (response.gateways || []).slice(0, limit);
    return prepareOutputData(gateways);
  },

  /**
   * Update a gateway
   */
  async update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;
    const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

    const body: IDataObject = {
      gateway: updateFields,
    };

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/gateways/${gatewayToken}.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'gateway')]);
  },

  /**
   * Redact (delete) a gateway
   */
  async redact(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/gateways/${gatewayToken}/redact.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'gateway')]);
  },

  /**
   * Retain a gateway (prevent automatic deletion)
   */
  async retain(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const gatewayToken = this.getNodeParameter('gatewayToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/gateways/${gatewayToken}/retain.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'gateway')]);
  },
};

/**
 * Gateway operation descriptions for n8n UI
 */
export const gatewayFields = [
  // Gateway Type for Create
  {
    displayName: 'Gateway Type',
    name: 'gatewayType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['gateway'],
        operation: ['create'],
      },
    },
    options: GATEWAY_TYPES,
    default: 'test',
    description: 'The type of payment gateway to provision',
  },
  // Gateway Token for operations that need it
  {
    displayName: 'Gateway Token',
    name: 'gatewayToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['gateway'],
        operation: ['get', 'update', 'redact', 'retain'],
      },
    },
    default: '',
    description: 'The unique token identifying the gateway',
  },
  // Return All for List
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['gateway'],
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
        resource: ['gateway'],
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
    name: 'additionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['gateway'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Login',
        name: 'login',
        type: 'string' as const,
        default: '',
        description: 'Gateway login/API key',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string' as const,
        typeOptions: { password: true },
        default: '',
        description: 'Gateway password/API secret',
      },
      {
        displayName: 'Merchant ID',
        name: 'merchant_id',
        type: 'string' as const,
        default: '',
        description: 'Merchant ID for the gateway',
      },
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options' as const,
        options: [
          { name: 'Test', value: 'test' },
          { name: 'Live', value: 'live' },
        ],
        default: 'test',
        description: 'Gateway mode (test or live)',
      },
    ],
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['gateway'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Login',
        name: 'login',
        type: 'string' as const,
        default: '',
        description: 'Gateway login/API key',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string' as const,
        typeOptions: { password: true },
        default: '',
        description: 'Gateway password/API secret',
      },
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options' as const,
        options: [
          { name: 'Test', value: 'test' },
          { name: 'Live', value: 'live' },
        ],
        default: 'test',
        description: 'Gateway mode (test or live)',
      },
    ],
  },
];
