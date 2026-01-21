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
 * Certificate resource operations (for Apple Pay, Google Pay)
 */
export const certificateOperations = {
  /**
   * Create a new certificate
   */
  async create(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateType = this.getNodeParameter('certificateType', i) as string;
    const additionalFields = this.getNodeParameter('certificateAdditionalFields', i, {}) as IDataObject;

    const body: IDataObject = {
      certificate: {
        certificate_type: certificateType,
        ...additionalFields,
      },
    };

    const response = await spreedlyApiRequest.call(this, 'POST', '/certificates.json', body);
    return prepareOutputData([simplifyResponse(response, 'certificate')]);
  },

  /**
   * Get a certificate by token
   */
  async get(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateToken = this.getNodeParameter('certificateToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/certificates/${certificateToken}.json`,
    );
    return prepareOutputData([simplifyResponse(response, 'certificate')]);
  },

  /**
   * List all certificates
   */
  async list(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      const certificates = await spreedlyApiRequestAllItems.call(
        this,
        'GET',
        '/certificates.json',
        'certificates',
      );
      return prepareOutputData(certificates);
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await spreedlyApiRequest.call(this, 'GET', '/certificates.json');
    const certificates = (response.certificates || []).slice(0, limit);
    return prepareOutputData(certificates);
  },

  /**
   * Update a certificate
   */
  async update(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateToken = this.getNodeParameter('certificateToken', i) as string;
    const updateFields = this.getNodeParameter('certificateUpdateFields', i) as IDataObject;

    const body: IDataObject = {
      certificate: updateFields,
    };

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/certificates/${certificateToken}.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'certificate')]);
  },

  /**
   * Download certificate signing request (CSR)
   */
  async downloadCsr(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateToken = this.getNodeParameter('certificateToken', i) as string;

    const response = await spreedlyApiRequest.call(
      this,
      'GET',
      `/certificates/${certificateToken}/csr.json`,
    );
    return prepareOutputData([response]);
  },

  /**
   * Upload signed certificate
   */
  async uploadSigned(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateToken = this.getNodeParameter('certificateToken', i) as string;
    const signedCertificate = this.getNodeParameter('signedCertificate', i) as string;

    const body: IDataObject = {
      certificate: {
        signed_certificate: signedCertificate,
      },
    };

    const response = await spreedlyApiRequest.call(
      this,
      'PUT',
      `/certificates/${certificateToken}.json`,
      body,
    );
    return prepareOutputData([simplifyResponse(response, 'certificate')]);
  },

  /**
   * Delete a certificate
   */
  async delete(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
    const certificateToken = this.getNodeParameter('certificateToken', i) as string;

    await spreedlyApiRequest.call(
      this,
      'DELETE',
      `/certificates/${certificateToken}.json`,
    );
    return prepareOutputData([{ success: true, deleted: certificateToken }]);
  },
};

/**
 * Certificate operation descriptions for n8n UI
 */
export const certificateFields = [
  // Certificate Type
  {
    displayName: 'Certificate Type',
    name: 'certificateType',
    type: 'options' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['certificate'],
        operation: ['create'],
      },
    },
    options: [
      { name: 'Apple Pay', value: 'apple_pay' },
      { name: 'Google Pay', value: 'google_pay' },
      { name: 'Generic', value: 'generic' },
    ],
    default: 'apple_pay',
    description: 'The type of certificate to create',
  },
  // Certificate Token
  {
    displayName: 'Certificate Token',
    name: 'certificateToken',
    type: 'string' as const,
    required: true,
    displayOptions: {
      show: {
        resource: ['certificate'],
        operation: ['get', 'update', 'downloadCsr', 'uploadSigned', 'delete'],
      },
    },
    default: '',
    description: 'The unique token identifying the certificate',
  },
  // Signed Certificate (for upload)
  {
    displayName: 'Signed Certificate',
    name: 'signedCertificate',
    type: 'string' as const,
    required: true,
    typeOptions: {
      rows: 10,
    },
    displayOptions: {
      show: {
        resource: ['certificate'],
        operation: ['uploadSigned'],
      },
    },
    default: '',
    description: 'The signed certificate (PEM format)',
  },
  // Return All for List
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean' as const,
    displayOptions: {
      show: {
        resource: ['certificate'],
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
        resource: ['certificate'],
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
    name: 'certificateAdditionalFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['certificate'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Common Name',
        name: 'common_name',
        type: 'string' as const,
        default: '',
        description: 'Common name for the certificate',
      },
      {
        displayName: 'Organization',
        name: 'organization',
        type: 'string' as const,
        default: '',
        description: 'Organization name for the certificate',
      },
      {
        displayName: 'Organization Unit',
        name: 'organization_unit',
        type: 'string' as const,
        default: '',
        description: 'Organization unit for the certificate',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string' as const,
        default: '',
        description: 'City/locality for the certificate',
      },
      {
        displayName: 'State',
        name: 'state',
        type: 'string' as const,
        default: '',
        description: 'State/province for the certificate',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string' as const,
        default: '',
        description: 'Country code (2-letter ISO)',
      },
    ],
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'certificateUpdateFields',
    type: 'collection' as const,
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['certificate'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Signed Certificate',
        name: 'signed_certificate',
        type: 'string' as const,
        typeOptions: { rows: 5 },
        default: '',
        description: 'The signed certificate (PEM format)',
      },
    ],
  },
];
