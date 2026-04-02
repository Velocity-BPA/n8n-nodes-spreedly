/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Spreedly } from '../nodes/Spreedly/Spreedly.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Spreedly Node', () => {
  let node: Spreedly;

  beforeAll(() => {
    node = new Spreedly();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Spreedly');
      expect(node.description.name).toBe('spreedly');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 5 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(5);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(5);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('PaymentMethod Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        environmentKey: 'test-key', 
        baseUrl: 'https://core.spreedly.com/v1' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(), 
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  it('should create a credit card payment method', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      const params: any = {
        operation: 'createPaymentMethod',
        paymentMethodType: 'credit_card',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        creditCardNumber: '4111111111111111',
        expirationMonth: 12,
        expirationYear: 2025,
        cvv: '123'
      };
      return params[name];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      payment_method: { token: 'test-token', state: 'retained' }
    });

    const result = await executePaymentMethodOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://core.spreedly.com/v1/payment_methods.xml'
      })
    );
  });

  it('should get a payment method by token', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      const params: any = {
        operation: 'getPaymentMethod',
        token: 'test-token'
      };
      return params[name];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      payment_method: { token: 'test-token', state: 'retained' }
    });

    const result = await executePaymentMethodOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://core.spreedly.com/v1/payment_methods/test-token.xml'
      })
    );
  });

  it('should list payment methods', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      const params: any = {
        operation: 'listPaymentMethods',
        count: 20,
        sinceToken: ''
      };
      return params[name];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      payment_methods: []
    });

    const result = await executePaymentMethodOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://core.spreedly.com/v1/payment_methods.xml?count=20'
      })
    );
  });

  it('should handle errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      const params: any = {
        operation: 'getPaymentMethod',
        token: 'invalid-token'
      };
      return params[name];
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(
      new Error('Payment method not found')
    );
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executePaymentMethodOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('error');
  });
});

describe('Gateway Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        environmentKey: 'test-env-key', 
        baseUrl: 'https://core.spreedly.com/v1' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  it('should create gateway successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createGateway')
      .mockReturnValueOnce('stripe')
      .mockReturnValueOnce('{"api_key": "sk_test_123"}')
      .mockReturnValueOnce('{}');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ gateway: { token: 'gw_123' } });

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({ gateway: { token: 'gw_123' } });
  });

  it('should handle create gateway error', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createGateway')
      .mockReturnValueOnce('stripe')
      .mockReturnValueOnce('{"api_key": "sk_test_123"}')
      .mockReturnValueOnce('{}');
    
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  it('should get gateway successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getGateway')
      .mockReturnValueOnce('gw_123');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ gateway: { token: 'gw_123', gateway_type: 'stripe' } });

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.gateway.token).toBe('gw_123');
  });

  it('should list gateways successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('listGateways');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ gateways: [{ token: 'gw_123' }] });

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.gateways).toHaveLength(1);
  });

  it('should update gateway successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('updateGateway')
      .mockReturnValueOnce('gw_123')
      .mockReturnValueOnce('{"api_key": "sk_live_456"}')
      .mockReturnValueOnce('{}');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ gateway: { token: 'gw_123' } });

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.gateway.token).toBe('gw_123');
  });

  it('should redact gateway successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('redactGateway')
      .mockReturnValueOnce('gw_123');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ gateway: { token: 'gw_123', redacted: true } });

    const result = await executeGatewayOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.gateway.redacted).toBe(true);
  });
});

describe('Transaction Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        environmentKey: 'test-env-key', 
        accessSecret: 'test-secret' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn().mockResolvedValue({ transaction: { token: 'test-token' } }) 
      },
    };
  });

  it('should create a purchase transaction successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createPurchase')
      .mockReturnValueOnce('gateway123')
      .mockReturnValueOnce('pm123')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce('USD')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(false);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://core.spreedly.com/v1/gateways/gateway123/purchase.xml',
        headers: expect.objectContaining({ 'Content-Type': 'application/xml' }),
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({ transaction: { token: 'test-token' } });
  });

  it('should handle purchase transaction errors', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('createPurchase');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValueOnce(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValueOnce(true);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result[0].json.error).toBe('API Error');
  });

  it('should create authorization successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createAuthorization')
      .mockReturnValueOnce('gateway123')
      .mockReturnValueOnce('pm123')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce('USD')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(false);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://core.spreedly.com/v1/gateways/gateway123/authorize.xml',
      })
    );
    expect(result).toHaveLength(1);
  });

  it('should capture transaction successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('captureTransaction')
      .mockReturnValueOnce('gateway123')
      .mockReturnValueOnce('auth123')
      .mockReturnValueOnce(1000);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://core.spreedly.com/v1/gateways/gateway123/capture/auth123.xml',
      })
    );
    expect(result).toHaveLength(1);
  });

  it('should create credit successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createCredit')
      .mockReturnValueOnce('gateway123')
      .mockReturnValueOnce('txn123')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce('');

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://core.spreedly.com/v1/gateways/gateway123/credit.xml',
      })
    );
    expect(result).toHaveLength(1);
  });

  it('should get transaction successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getTransaction')
      .mockReturnValueOnce('txn123');

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://core.spreedly.com/v1/transactions/txn123.xml',
      })
    );
    expect(result).toHaveLength(1);
  });

  it('should list transactions successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('listTransactions')
      .mockReturnValueOnce('')
      .mockReturnValueOnce(20)
      .mockReturnValueOnce('');

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://core.spreedly.com/v1/transactions.xml',
      })
    );
    expect(result).toHaveLength(1);
  });

  it('should throw error for unknown operation', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('unknownOperation');

    await expect(
      executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Unknown operation: unknownOperation');
  });
});

describe('Receiver Resource', () => {
  let mockExecuteFunctions: any;
  
  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        environmentKey: 'test-env-key', 
        accessSecret: 'test-access-secret', 
        baseUrl: 'https://core.spreedly.com/v1' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { httpRequest: jest.fn(), requestWithAuthentication: jest.fn() },
    };
  });

  it('should create receiver successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('createReceiver')
      .mockReturnValueOnce('stripe')
      .mockReturnValueOnce('example.com')
      .mockReturnValueOnce('{"api_key": "sk_test_123"}');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue('<receiver><token>test-token</token></receiver>');

    const result = await executeReceiverOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://core.spreedly.com/v1/receivers.xml',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': expect.stringContaining('Basic'),
      },
      body: expect.stringContaining('<receiver_type>stripe</receiver_type>'),
    });
  });

  it('should get receiver successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getReceiver')
      .mockReturnValueOnce('receiver-token-123');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue('<receiver><token>receiver-token-123</token></receiver>');

    const result = await executeReceiverOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://core.spreedly.com/v1/receivers/receiver-token-123.xml',
      headers: {
        'Authorization': expect.stringContaining('Basic'),
      },
    });
  });

  it('should list receivers successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('listReceivers');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue('<receivers><receiver><token>token1</token></receiver></receivers>');

    const result = await executeReceiverOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://core.spreedly.com/v1/receivers.xml',
      headers: {
        'Authorization': expect.stringContaining('Basic'),
      },
    });
  });

  it('should handle errors gracefully when continueOnFail is true', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getReceiver').mockReturnValueOnce('invalid-token');
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Receiver not found'));

    const result = await executeReceiverOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('Receiver not found');
  });
});

describe('Certificate Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				environmentKey: 'test-env-key',
				accessSecret: 'test-access-secret',
				baseUrl: 'https://core.spreedly.com/v1',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
			},
		};
	});

	it('should create a certificate successfully', async () => {
		const mockCertificate = '-----BEGIN CERTIFICATE-----\nMOCKCERT\n-----END CERTIFICATE-----';
		const mockPrivateKey = '-----BEGIN PRIVATE KEY-----\nMOCKKEY\n-----END PRIVATE KEY-----';

		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('createCertificate')
			.mockReturnValueOnce(mockCertificate)
			.mockReturnValueOnce(mockPrivateKey);

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			certificate: { token: 'cert_123' },
		});

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: 'https://core.spreedly.com/v1/certificates.xml',
			}),
		);
	});

	it('should get a certificate successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getCertificate')
			.mockReturnValueOnce('cert_123');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			certificate: { token: 'cert_123' },
		});

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: 'https://core.spreedly.com/v1/certificates/cert_123.xml',
			}),
		);
	});

	it('should list certificates successfully', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('listCertificates');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			certificates: [{ token: 'cert_123' }, { token: 'cert_456' }],
		});

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: 'https://core.spreedly.com/v1/certificates.xml',
			}),
		);
	});

	it('should update a certificate successfully', async () => {
		const mockCertificate = '-----BEGIN CERTIFICATE-----\nUPDATEDCERT\n-----END CERTIFICATE-----';

		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('updateCertificate')
			.mockReturnValueOnce('cert_123')
			.mockReturnValueOnce(mockCertificate)
			.mockReturnValueOnce('');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			certificate: { token: 'cert_123' },
		});

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'PUT',
				url: 'https://core.spreedly.com/v1/certificates/cert_123.xml',
			}),
		);
	});

	it('should redact a certificate successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('redactCertificate')
			.mockReturnValueOnce('cert_123');

		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			certificate: { token: 'cert_123' },
		});

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'PUT',
				url: 'https://core.spreedly.com/v1/certificates/cert_123/redact.xml',
			}),
		);
	});

	it('should handle errors gracefully when continueOnFail is true', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getCertificate');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		const result = await executeCertificateOperations.call(
			mockExecuteFunctions,
			[{ json: {} }],
		);

		expect(result).toHaveLength(1);
		expect(result[0].json).toEqual({ error: 'API Error' });
	});

	it('should throw error when continueOnFail is false', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getCertificate');
		mockExecuteFunctions.continueOnFail.mockReturnValue(false);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));

		await expect(
			executeCertificateOperations.call(mockExecuteFunctions, [{ json: {} }]),
		).rejects.toThrow('API Error');
	});
});
});
