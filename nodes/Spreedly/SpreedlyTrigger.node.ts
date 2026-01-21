/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
} from 'n8n-workflow';

import { displayLicensingNotice, parseWebhookPayload } from './utils';
import { WEBHOOK_EVENT_TYPES } from './constants';

export class SpreedlyTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Spreedly Trigger',
    name: 'spreedlyTrigger',
    icon: 'file:spreedly.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["events"].join(", ")}}',
    description: 'Receive Spreedly webhook events for transactions, payment methods, and more',
    defaults: {
      name: 'Spreedly Trigger',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: [...WEBHOOK_EVENT_TYPES],
        default: ['transaction.succeeded', 'transaction.failed'],
        required: true,
        description: 'The events to listen for. Select all that apply.',
      },
      {
        displayName: 'Setup Instructions',
        name: 'setupNotice',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {},
        },
        description: `To set up Spreedly webhooks:
1. Copy the webhook URL shown below
2. Log in to your Spreedly Dashboard
3. Go to Settings → Webhooks
4. Click "Add Webhook Endpoint"
5. Paste the webhook URL
6. Select the events you want to receive
7. Save the webhook configuration`,
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    // Display licensing notice once per node load
    displayLicensingNotice();

    const bodyData = this.getBodyData();
    const selectedEvents = this.getNodeParameter('events') as string[];

    // Parse the webhook payload
    const parsedData = parseWebhookPayload(bodyData);

    // Determine the event type from the payload
    let eventType = 'unknown';
    if (parsedData.type === 'transaction') {
      const transaction = parsedData.data as Record<string, any>;
      if (transaction?.succeeded === true) {
        eventType = 'transaction.succeeded';
      } else if (transaction?.succeeded === false) {
        eventType = 'transaction.failed';
      } else if (transaction?.state === 'pending') {
        eventType = 'transaction.pending';
      }
    } else if (parsedData.type === 'payment_method') {
      const pm = parsedData.data as Record<string, any>;
      if (pm?.storage_state === 'retained') {
        eventType = 'payment_method.retained';
      } else if (pm?.storage_state === 'redacted') {
        eventType = 'payment_method.redacted';
      } else if (pm?.storage_state === 'cached') {
        eventType = 'payment_method.added';
      } else {
        eventType = 'payment_method.updated';
      }
    } else if (parsedData.type === 'gateway') {
      const gw = parsedData.data as Record<string, any>;
      if (gw?.state === 'retained') {
        eventType = 'gateway.retained';
      } else if (gw?.state === 'redacted') {
        eventType = 'gateway.redacted';
      } else {
        eventType = 'gateway.added';
      }
    } else if (parsedData.type === 'receiver') {
      const rcv = parsedData.data as Record<string, any>;
      if (rcv?.state === 'redacted') {
        eventType = 'receiver.redacted';
      } else {
        eventType = 'receiver.added';
      }
    } else if (parsedData.type === 'certificate') {
      eventType = 'certificate.added';
    }

    // Check if this event is one we're listening for
    // If no events match, we still process it (filter is informational)
    const isSelectedEvent = selectedEvents.includes(eventType) || selectedEvents.length === 0;

    if (!isSelectedEvent) {
      // Return empty to skip this event
      return {
        workflowData: [[]],
      };
    }

    // Return the parsed webhook data
    return {
      workflowData: [
        [
          {
            json: {
              event: eventType,
              ...parsedData,
              raw: bodyData,
            },
          },
        ],
      ],
    };
  }
}
