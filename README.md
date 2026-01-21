# n8n-nodes-spreedly

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

n8n community node for Spreedly payment orchestration - Universal tokenization, multi-gateway routing, and PCI-compliant payment processing through 100+ payment gateways via a single API.

![Spreedly](https://img.shields.io/badge/Spreedly-Payment%20Orchestration-00D4AA)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-FF6D5A)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)

## Features

Spreedly is the leading payment orchestration platform that enables businesses to connect to 100+ payment gateways through a single API. This n8n community node provides full access to Spreedly's API, allowing you to build sophisticated payment workflows.

| Feature | Description |
|---------|-------------|
| **Multi-Gateway Support** | Provision and manage 100+ payment gateways (Stripe, Braintree, Adyen, etc.) |
| **Universal Tokenization** | Tokenize cards once, use across any gateway |
| **Transaction Processing** | Purchase, authorize, capture, void, refund |
| **3D Secure** | Full 3DS1 and 3DS2 flow support for SCA compliance |
| **Receivers** | Deliver card data to non-gateway APIs securely |
| **Certificates** | Apple Pay / Google Pay certificate management |
| **Webhook Triggers** | React to payment events in real-time |
| **Sandbox Mode** | Test all operations without real charges |

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-spreedly`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Clone or extract the package
git clone https://github.com/Velocity-BPA/n8n-nodes-spreedly.git
cd n8n-nodes-spreedly

# Install dependencies and build
npm install --legacy-peer-deps
npm run build
```

### Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-spreedly.zip
cd n8n-nodes-spreedly

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-spreedly

# 5. Restart n8n
n8n start
```

## Credentials Setup

| Field | Description |
|-------|-------------|
| **Environment Key** | Your Spreedly environment key |
| **Access Secret** | Your Spreedly access secret |
| **Sandbox Mode** | Enable for testing (uses sandbox endpoints) |

Get your credentials from the [Spreedly Dashboard](https://dashboard.spreedly.com) under **Settings** → **Environment**.

## Resources & Operations

### Gateway

Manage payment gateways (100+ supported types including Stripe, Braintree, Adyen, Authorize.Net, PayPal Commerce, and more).

| Operation | Description |
|-----------|-------------|
| Create | Provision a new gateway |
| Get | Retrieve gateway details |
| List | List all gateways |
| Update | Update gateway configuration |
| Redact | Delete a gateway |
| Retain | Mark gateway for permanent storage |

### Payment Method

Tokenize and manage payment methods with universal tokens that work across all gateways.

| Operation | Description |
|-----------|-------------|
| Tokenize | Create a payment method token (credit card or bank account) |
| Get | Retrieve payment method details |
| List | List payment methods |
| Retain | Mark for permanent storage |
| Redact | Delete a payment method |
| Recache CVV | Update CVV for a stored card |
| Store at Gateway | Store token at a specific gateway |

### Transaction

Process payments through your configured gateways.

| Operation | Description |
|-----------|-------------|
| Purchase | Charge a payment method |
| Authorize | Pre-authorize funds |
| Capture | Capture an authorized transaction |
| Void | Cancel a transaction |
| Refund | Refund a completed transaction |
| General Credit | Issue credit without prior purchase |
| Verify | Verify a payment method |
| Get | Retrieve transaction details |
| List | List transactions |
| Get Transcript | Get raw gateway communication |

### 3D Secure

Authenticate payments with 3D Secure for SCA compliance.

| Operation | Description |
|-----------|-------------|
| Initialize | Start 3DS authentication |
| Complete | Complete 3DS authentication |
| Lookup | Check 3DS enrollment |
| Get Status | Get authentication status |
| Submit Fingerprint | Submit device fingerprint (3DS2) |
| Submit Challenge | Submit challenge response |

### Receiver

Deliver card data to non-gateway APIs (loyalty programs, fraud services, etc.).

| Operation | Description |
|-----------|-------------|
| Create | Create a receiver endpoint |
| Get | Retrieve receiver details |
| List | List all receivers |
| Update | Update receiver configuration |
| Redact | Delete a receiver |
| Deliver | Send payment data to receiver |

### Certificate

Manage certificates for Apple Pay and Google Pay.

| Operation | Description |
|-----------|-------------|
| Create | Create a certificate |
| Get | Retrieve certificate details |
| List | List all certificates |
| Update | Update certificate |
| Download CSR | Download certificate signing request |
| Upload Signed | Upload signed certificate |
| Delete | Delete a certificate |

## Trigger Node

The **Spreedly Trigger** node receives webhook events in real-time.

### Supported Events

| Event | Description |
|-------|-------------|
| transaction.succeeded | Transaction completed successfully |
| transaction.failed | Transaction failed |
| transaction.pending | Transaction is pending |
| payment_method.added | Payment method created |
| payment_method.retained | Payment method retained |
| payment_method.redacted | Payment method deleted |
| payment_method.updated | Payment method updated |
| gateway.added | Gateway created |
| gateway.redacted | Gateway deleted |
| gateway.retained | Gateway retained |
| receiver.added | Receiver created |
| receiver.redacted | Receiver deleted |
| certificate.added | Certificate created |

## Usage Examples

### Basic Purchase

```
1. Spreedly: Create Credit Card token
   - Card Number: 4111111111111111
   - Expiration: 12/2025
   - CVV: 123
   - Retain: Yes

2. Spreedly: Purchase
   - Gateway Token: [your_gateway_token]
   - Payment Method Token: {{ $node["Spreedly"].json.token }}
   - Amount: 99.99
   - Currency: USD
```

### Multi-Gateway Failover

```
1. Spreedly: Purchase (Primary Gateway)
   - Continue on Fail: Yes

2. IF: Check if succeeded
   - Condition: {{ $json.succeeded }} equals true

3. Spreedly: Purchase (Backup Gateway)
   - Same payment method token works!
```

## Universal Tokenization

Spreedly's key advantage is universal tokenization. When you tokenize a payment method, the resulting token works across all 100+ gateways without re-collecting card data.

## 3D Secure Flow

For Strong Customer Authentication (SCA) compliance, use the 3D Secure flow. Initialize authentication, redirect the customer to complete the bank challenge, then complete the transaction when they return.

## Supported Gateways

Spreedly supports 100+ payment gateways including Stripe, Braintree, Adyen, Authorize.Net, CyberSource, PayPal Commerce Platform, Worldpay, Checkout.com, Square, NMI, and many more.

## Error Handling

The node provides detailed error messages from Spreedly's API including error codes, human-readable messages, and AVS/CVV verification results.

## Security Best Practices

1. Never log full card numbers - use tokens
2. Use sandbox mode for testing
3. Enable 3D Secure for SCA compliance
4. Regularly rotate API credentials
5. Use webhook signatures for verification

## Development

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Watch mode for development
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

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support

- **Documentation**: [Spreedly API Docs](https://docs.spreedly.com/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-spreedly/issues)
- **Commercial Support**: licensing@velobpa.com

## Acknowledgments

- [Spreedly](https://spreedly.com) for their payment orchestration platform
- [n8n](https://n8n.io) for the workflow automation platform
