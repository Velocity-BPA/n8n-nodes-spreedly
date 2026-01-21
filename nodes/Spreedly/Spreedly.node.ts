/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import { displayLicensingNotice } from './utils';
import { gatewayOperations, gatewayFields } from './actions/gateway';
import { paymentMethodOperations, paymentMethodFields } from './actions/paymentMethod';
import { transactionOperations, transactionFields } from './actions/transaction';
import { threeDSecureOperations, threeDSecureFields } from './actions/threeDSecure';
import { receiverOperations, receiverFields } from './actions/receiver';
import { certificateOperations, certificateFields } from './actions/certificate';

export class Spreedly implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Spreedly',
    name: 'spreedly',
    icon: 'file:spreedly.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Universal payment orchestration - tokenization, multi-gateway routing, and PCI-compliant processing',
    defaults: {
      name: 'Spreedly',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'spreedlyApi',
        required: true,
      },
    ],
    properties: [
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Certificate',
            value: 'certificate',
            description: 'Manage Apple Pay/Google Pay certificates',
          },
          {
            name: 'Gateway',
            value: 'gateway',
            description: 'Manage payment gateways',
          },
          {
            name: 'Payment Method',
            value: 'paymentMethod',
            description: 'Tokenize and manage payment methods',
          },
          {
            name: 'Receiver',
            value: 'receiver',
            description: 'Deliver card data to non-gateway APIs',
          },
          {
            name: 'Transaction',
            value: 'transaction',
            description: 'Process payments (purchase, authorize, capture, refund)',
          },
          {
            name: '3D Secure',
            value: 'threeDSecure',
            description: 'Authenticate payments with 3D Secure',
          },
        ],
        default: 'transaction',
      },

      // Gateway Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['gateway'],
          },
        },
        options: [
          { name: 'Create', value: 'create', description: 'Create a new gateway', action: 'Create a gateway' },
          { name: 'Get', value: 'get', description: 'Get a gateway by token', action: 'Get a gateway' },
          { name: 'List', value: 'list', description: 'List all gateways', action: 'List gateways' },
          { name: 'Update', value: 'update', description: 'Update a gateway', action: 'Update a gateway' },
          { name: 'Redact', value: 'redact', description: 'Redact (delete) a gateway', action: 'Redact a gateway' },
          { name: 'Retain', value: 'retain', description: 'Retain a gateway', action: 'Retain a gateway' },
        ],
        default: 'create',
      },

      // Payment Method Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['paymentMethod'],
          },
        },
        options: [
          { name: 'Tokenize', value: 'tokenize', description: 'Create a payment method token', action: 'Tokenize a payment method' },
          { name: 'Get', value: 'get', description: 'Get a payment method by token', action: 'Get a payment method' },
          { name: 'List', value: 'list', description: 'List payment methods', action: 'List payment methods' },
          { name: 'Retain', value: 'retain', description: 'Retain a payment method', action: 'Retain a payment method' },
          { name: 'Redact', value: 'redact', description: 'Redact a payment method', action: 'Redact a payment method' },
          { name: 'Recache CVV', value: 'recache', description: 'Recache the CVV for a payment method', action: 'Recache CVV' },
          { name: 'Store at Gateway', value: 'storeAtGateway', description: 'Store payment method at a specific gateway', action: 'Store at gateway' },
        ],
        default: 'tokenize',
      },

      // Transaction Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['transaction'],
          },
        },
        options: [
          { name: 'Purchase', value: 'purchase', description: 'Create a purchase transaction', action: 'Create a purchase' },
          { name: 'Authorize', value: 'authorize', description: 'Authorize a transaction', action: 'Authorize a transaction' },
          { name: 'Capture', value: 'capture', description: 'Capture an authorized transaction', action: 'Capture a transaction' },
          { name: 'Void', value: 'void', description: 'Void a transaction', action: 'Void a transaction' },
          { name: 'Refund', value: 'refund', description: 'Refund a transaction', action: 'Refund a transaction' },
          { name: 'General Credit', value: 'generalCredit', description: 'Issue a credit without a prior purchase', action: 'Issue general credit' },
          { name: 'Verify', value: 'verify', description: 'Verify a payment method', action: 'Verify a payment method' },
          { name: 'Get', value: 'get', description: 'Get a transaction by token', action: 'Get a transaction' },
          { name: 'List', value: 'list', description: 'List transactions', action: 'List transactions' },
          { name: 'Get Transcript', value: 'getTranscript', description: 'Get the transcript of a transaction', action: 'Get transcript' },
        ],
        default: 'purchase',
      },

      // 3D Secure Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['threeDSecure'],
          },
        },
        options: [
          { name: 'Initialize', value: 'initialize', description: 'Initialize 3D Secure authentication', action: 'Initialize 3D Secure' },
          { name: 'Complete', value: 'complete', description: 'Complete 3D Secure authentication', action: 'Complete 3D Secure' },
          { name: 'Lookup', value: 'lookup', description: 'Lookup 3D Secure status', action: 'Lookup 3D Secure' },
          { name: 'Get Status', value: 'getStatus', description: 'Get 3D Secure transaction status', action: 'Get 3D Secure status' },
          { name: 'Submit Fingerprint', value: 'submitFingerprint', description: 'Submit device fingerprint for 3DS2', action: 'Submit fingerprint' },
          { name: 'Submit Challenge', value: 'submitChallenge', description: 'Submit challenge response', action: 'Submit challenge' },
        ],
        default: 'initialize',
      },

      // Receiver Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['receiver'],
          },
        },
        options: [
          { name: 'Create', value: 'create', description: 'Create a new receiver', action: 'Create a receiver' },
          { name: 'Get', value: 'get', description: 'Get a receiver by token', action: 'Get a receiver' },
          { name: 'List', value: 'list', description: 'List all receivers', action: 'List receivers' },
          { name: 'Update', value: 'update', description: 'Update a receiver', action: 'Update a receiver' },
          { name: 'Redact', value: 'redact', description: 'Redact a receiver', action: 'Redact a receiver' },
          { name: 'Deliver', value: 'deliver', description: 'Deliver payment data to a receiver', action: 'Deliver to receiver' },
        ],
        default: 'create',
      },

      // Certificate Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['certificate'],
          },
        },
        options: [
          { name: 'Create', value: 'create', description: 'Create a new certificate', action: 'Create a certificate' },
          { name: 'Delete', value: 'delete', description: 'Delete a certificate', action: 'Delete a certificate' },
          { name: 'Download CSR', value: 'downloadCsr', description: 'Download certificate signing request', action: 'Download CSR' },
          { name: 'Get', value: 'get', description: 'Get a certificate by token', action: 'Get a certificate' },
          { name: 'List', value: 'list', description: 'List all certificates', action: 'List certificates' },
          { name: 'Update', value: 'update', description: 'Update a certificate', action: 'Update a certificate' },
          { name: 'Upload Signed', value: 'uploadSigned', description: 'Upload signed certificate', action: 'Upload signed certificate' },
        ],
        default: 'create',
      },

      // Resource-specific fields
      ...gatewayFields,
      ...paymentMethodFields,
      ...transactionFields,
      ...threeDSecureFields,
      ...receiverFields,
      ...certificateFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Display licensing notice once per node load
    displayLicensingNotice();

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'gateway':
            result = await executeGatewayOperation.call(this, operation, i);
            break;
          case 'paymentMethod':
            result = await executePaymentMethodOperation.call(this, operation, i);
            break;
          case 'transaction':
            result = await executeTransactionOperation.call(this, operation, i);
            break;
          case 'threeDSecure':
            result = await executeThreeDSecureOperation.call(this, operation, i);
            break;
          case 'receiver':
            result = await executeReceiverOperation.call(this, operation, i);
            break;
          case 'certificate':
            result = await executeCertificateOperation.call(this, operation, i);
            break;
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

// Helper functions to execute operations by resource type
async function executeGatewayOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'create':
      return gatewayOperations.create.call(this, i);
    case 'get':
      return gatewayOperations.get.call(this, i);
    case 'list':
      return gatewayOperations.list.call(this, i);
    case 'update':
      return gatewayOperations.update.call(this, i);
    case 'redact':
      return gatewayOperations.redact.call(this, i);
    case 'retain':
      return gatewayOperations.retain.call(this, i);
    default:
      throw new Error(`Unknown gateway operation: ${operation}`);
  }
}

async function executePaymentMethodOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'tokenize':
      return paymentMethodOperations.tokenize.call(this, i);
    case 'get':
      return paymentMethodOperations.get.call(this, i);
    case 'list':
      return paymentMethodOperations.list.call(this, i);
    case 'retain':
      return paymentMethodOperations.retain.call(this, i);
    case 'redact':
      return paymentMethodOperations.redact.call(this, i);
    case 'recache':
      return paymentMethodOperations.recache.call(this, i);
    case 'storeAtGateway':
      return paymentMethodOperations.storeAtGateway.call(this, i);
    default:
      throw new Error(`Unknown payment method operation: ${operation}`);
  }
}

async function executeTransactionOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'purchase':
      return transactionOperations.purchase.call(this, i);
    case 'authorize':
      return transactionOperations.authorize.call(this, i);
    case 'capture':
      return transactionOperations.capture.call(this, i);
    case 'void':
      return transactionOperations.void.call(this, i);
    case 'refund':
      return transactionOperations.refund.call(this, i);
    case 'generalCredit':
      return transactionOperations.generalCredit.call(this, i);
    case 'verify':
      return transactionOperations.verify.call(this, i);
    case 'get':
      return transactionOperations.get.call(this, i);
    case 'list':
      return transactionOperations.list.call(this, i);
    case 'getTranscript':
      return transactionOperations.getTranscript.call(this, i);
    default:
      throw new Error(`Unknown transaction operation: ${operation}`);
  }
}

async function executeThreeDSecureOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'initialize':
      return threeDSecureOperations.initialize.call(this, i);
    case 'complete':
      return threeDSecureOperations.complete.call(this, i);
    case 'lookup':
      return threeDSecureOperations.lookup.call(this, i);
    case 'getStatus':
      return threeDSecureOperations.getStatus.call(this, i);
    case 'submitFingerprint':
      return threeDSecureOperations.submitFingerprint.call(this, i);
    case 'submitChallenge':
      return threeDSecureOperations.submitChallenge.call(this, i);
    default:
      throw new Error(`Unknown 3D Secure operation: ${operation}`);
  }
}

async function executeReceiverOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'create':
      return receiverOperations.create.call(this, i);
    case 'get':
      return receiverOperations.get.call(this, i);
    case 'list':
      return receiverOperations.list.call(this, i);
    case 'update':
      return receiverOperations.update.call(this, i);
    case 'redact':
      return receiverOperations.redact.call(this, i);
    case 'deliver':
      return receiverOperations.deliver.call(this, i);
    default:
      throw new Error(`Unknown receiver operation: ${operation}`);
  }
}

async function executeCertificateOperation(
  this: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'create':
      return certificateOperations.create.call(this, i);
    case 'get':
      return certificateOperations.get.call(this, i);
    case 'list':
      return certificateOperations.list.call(this, i);
    case 'update':
      return certificateOperations.update.call(this, i);
    case 'downloadCsr':
      return certificateOperations.downloadCsr.call(this, i);
    case 'uploadSigned':
      return certificateOperations.uploadSigned.call(this, i);
    case 'delete':
      return certificateOperations.delete.call(this, i);
    default:
      throw new Error(`Unknown certificate operation: ${operation}`);
  }
}
