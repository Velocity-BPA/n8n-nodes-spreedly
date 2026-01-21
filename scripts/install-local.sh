#!/bin/bash
set -e

echo "📦 Installing n8n-nodes-spreedly locally..."

# Build the project
./scripts/build.sh

# Create n8n custom directory if it doesn't exist
mkdir -p ~/.n8n/custom

# Remove existing symlink if present
rm -f ~/.n8n/custom/n8n-nodes-spreedly

# Create symlink
ln -s "$(pwd)" ~/.n8n/custom/n8n-nodes-spreedly

echo "✅ Installation complete!"
echo "🔄 Please restart n8n to load the new node."
echo ""
echo "Next steps:"
echo "1. Restart n8n: n8n start"
echo "2. In n8n, search for 'Spreedly' when adding a node"
echo "3. Configure your Spreedly API credentials"
echo ""
echo "Troubleshooting:"
echo "- If the node doesn't appear, check n8n logs for errors"
echo "- Ensure N8N_CUSTOM_EXTENSIONS is set if using custom location"
echo "- Try: export N8N_CUSTOM_EXTENSIONS=\"~/.n8n/custom\""
