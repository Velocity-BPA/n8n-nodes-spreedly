/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SpreedlyApi implements ICredentialType {
  name = 'spreedlyApi';
  displayName = 'Spreedly API';
  documentationUrl = 'https://docs.spreedly.com/reference/api/v1/';

  properties: INodeProperties[] = [
    {
      displayName: 'Environment Key',
      name: 'environmentKey',
      type: 'string',
      default: '',
      required: true,
      description: 'Your Spreedly Environment Key from the dashboard',
      placeholder: 'e.g., E1234567890ABCDEF',
    },
    {
      displayName: 'Access Secret',
      name: 'accessSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your Spreedly Access Secret from the dashboard',
    },
    {
      displayName: 'Use Sandbox',
      name: 'sandbox',
      type: 'boolean',
      default: true,
      description: 'Whether to use the Spreedly sandbox environment for testing',
    },
  ];
}
