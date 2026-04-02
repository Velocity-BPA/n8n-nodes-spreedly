# n8n-nodes-spreedly

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

This n8n community node provides comprehensive integration with Spreedly's secure payment orchestration platform. With 5 core resources including PaymentMethod, Gateway, Transaction, Receiver, and Certificate, it enables secure payment processing, gateway management, and PCI-compliant transaction handling within your n8n workflows.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![PCI Compliant](https://img.shields.io/badge/PCI-Compliant-green)
![Payment Processing](https://img.shields.io/badge/Payments-Orchestration-orange)
![Gateway Management](https://img.shields.io/badge/Multi-Gateway-Management-purple)

## Features

- **Secure Payment Processing** - Process payments across multiple gateways with PCI-compliant tokenization
- **Gateway Management** - Configure and manage multiple payment gateways from a single interface
- **Transaction Monitoring** - Track, verify, and manage payment transactions with detailed reporting
- **Certificate Handling** - Manage SSL certificates and security credentials for payment processing
- **Receiver Management** - Handle payment receivers and distribution configurations
- **Multi-Gateway Support** - Integrate with 100+ payment gateways through Spreedly's unified API
- **Tokenization & Vault** - Securely store payment methods using Spreedly's PCI-compliant vault
- **Real-time Webhooks** - Process payment events and notifications in real-time

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-spreedly`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-spreedly
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-spreedly.git
cd n8n-nodes-spreedly
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-spreedly
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| Environment Key | Your Spreedly environment key | ✓ |
| Access Secret | Your Spreedly access secret | ✓ |
| Environment | Spreedly environment (sandbox/production) | ✓ |

## Resources & Operations

### 1. PaymentMethod

| Operation | Description |
|-----------|-------------|
| Create | Create a new payment method with card or bank details |
| Get | Retrieve payment method details by token |
| List | List all payment methods in the environment |
| Update | Update payment method information |
| Delete | Remove a payment method from the vault |
| Verify | Verify payment method validity |

### 2. Gateway

| Operation | Description |
|-----------|-------------|
| Create | Add a new payment gateway configuration |
| Get | Retrieve gateway details and status |
| List | List all configured gateways |
| Update | Update gateway configuration and credentials |
| Delete | Remove gateway configuration |
| Test | Test gateway connection and credentials |

### 3. Transaction

| Operation | Description |
|-----------|-------------|
| Purchase | Process a purchase transaction |
| Authorize | Authorize a payment without capturing |
| Capture | Capture a previously authorized payment |
| Void | Void an authorized transaction |
| Refund | Refund a completed transaction |
| Get | Retrieve transaction details |
| List | List transactions with filtering options |

### 4. Receiver

| Operation | Description |
|-----------|-------------|
| Create | Create a new payment receiver |
| Get | Retrieve receiver configuration |
| List | List all payment receivers |
| Update | Update receiver settings |
| Delete | Remove a payment receiver |
| Deliver | Deliver payment to receiver |

### 5. Certificate

| Operation | Description |
|-----------|-------------|
| Upload | Upload SSL certificate for secure processing |
| Get | Retrieve certificate details |
| List | List all certificates |
| Update | Update certificate information |
| Delete | Remove certificate |
| Verify | Verify certificate validity |

## Usage Examples

```javascript
// Process a credit card payment
{
  "payment_method_token": "{{$node['Create Payment Method'].json['payment_method']['token']}}",
  "amount": 2500,
  "currency_code": "USD",
  "gateway_token": "{{$node['Get Gateway'].json['gateway']['token']}}",
  "order_id": "ORDER-123"
}
```

```javascript
// Create a payment method with credit card
{
  "credit_card": {
    "number": "4111111111111111",
    "verification_value": "123",
    "month": "12",
    "year": "2025",
    "first_name": "John",
    "last_name": "Doe"
  },
  "email": "john.doe@example.com"
}
```

```javascript
// Configure a Stripe gateway
{
  "gateway_type": "stripe",
  "login": "sk_test_123456789",
  "password": "",
  "server": "https://api.stripe.com",
  "test": true
}
```

```javascript
// List transactions with date filter
{
  "since_token": "",
  "count": 20,
  "order": "desc",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Authentication Failed | Invalid API credentials | Verify environment key and access secret |
| Payment Method Invalid | Card details are incorrect | Check card number, CVV, and expiration date |
| Gateway Error | Payment gateway rejected transaction | Review gateway configuration and test credentials |
| Insufficient Funds | Customer's account lacks funds | Request alternative payment method |
| Transaction Not Found | Invalid transaction token | Verify transaction token and permissions |
| Rate Limit Exceeded | Too many API requests | Implement exponential backoff retry logic |

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-spreedly/issues)
- **Spreedly API Documentation**: [docs.spreedly.com](https://docs.spreedly.com)
- **Spreedly Community**: [community.spreedly.com](https://community.spreedly.com)