#!/usr/bin/env bash
set -Eeuo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-xcel360-prod}"
LOCATION="${AZURE_LOCATION:-francecentral}"
CONTAINER_APP="${AZURE_CONTAINER_APP:-xcel360-web}"
IDENTITY_NAME="${AZURE_DEPLOY_IDENTITY:-xcel360-github-deploy}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-Rexpect001/Xcel360}"
GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-production}"
FEDERATED_CREDENTIAL_NAME="github-${GITHUB_ENVIRONMENT}"
ROLE_NAME="Container Apps Contributor"

for command in az; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: $command is required." >&2
    exit 1
  fi
done

if ! az account show --output none 2>/dev/null; then
  echo "ERROR: Sign in to Azure CLI before running this script." >&2
  exit 1
fi

az containerapp show \
  --name "$CONTAINER_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

echo "Registering the managed identity provider..."
az provider register --namespace Microsoft.ManagedIdentity --wait

if az identity show \
  --name "$IDENTITY_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none 2>/dev/null; then
  echo "Reusing managed identity $IDENTITY_NAME."
else
  echo "Creating managed identity $IDENTITY_NAME in $LOCATION..."
  az identity create \
    --name "$IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none
fi

CLIENT_ID="$(
  az identity show \
    --name "$IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query clientId \
    --output tsv
)"
PRINCIPAL_ID="$(
  az identity show \
    --name "$IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId \
    --output tsv
)"
TENANT_ID="$(az account show --query tenantId --output tsv)"
SUBSCRIPTION_ID="$(az account show --query id --output tsv)"
RESOURCE_GROUP_ID="$(
  az group show \
    --name "$RESOURCE_GROUP" \
    --query id \
    --output tsv
)"

role_count="$(
  az role assignment list \
    --assignee "$PRINCIPAL_ID" \
    --scope "$RESOURCE_GROUP_ID" \
    --role "$ROLE_NAME" \
    --query 'length(@)' \
    --output tsv
)"

if [[ "$role_count" == "0" ]]; then
  echo "Granting $ROLE_NAME on $RESOURCE_GROUP..."
  az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$ROLE_NAME" \
    --scope "$RESOURCE_GROUP_ID" \
    --output none
else
  echo "The required Azure role assignment already exists."
fi

OIDC_ISSUER="https://token.actions.githubusercontent.com"
OIDC_SUBJECT="repo:${GITHUB_REPOSITORY}:environment:${GITHUB_ENVIRONMENT}"
OIDC_AUDIENCE="api://AzureADTokenExchange"

if az identity federated-credential show \
  --name "$FEDERATED_CREDENTIAL_NAME" \
  --identity-name "$IDENTITY_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none 2>/dev/null; then
  echo "Updating the existing GitHub federated credential..."
  az identity federated-credential update \
    --name "$FEDERATED_CREDENTIAL_NAME" \
    --identity-name "$IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --issuer "$OIDC_ISSUER" \
    --subject "$OIDC_SUBJECT" \
    --audiences "$OIDC_AUDIENCE" \
    --output none
else
  echo "Creating the GitHub federated credential..."
  az identity federated-credential create \
    --name "$FEDERATED_CREDENTIAL_NAME" \
    --identity-name "$IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --issuer "$OIDC_ISSUER" \
    --subject "$OIDC_SUBJECT" \
    --audiences "$OIDC_AUDIENCE" \
    --output none
fi

cat <<EOF

AZURE OIDC SETUP COMPLETE

Create a GitHub environment named: $GITHUB_ENVIRONMENT
Add these environment secrets:

AZURE_CLIENT_ID=$CLIENT_ID
AZURE_TENANT_ID=$TENANT_ID
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID

Then create this repository Actions variable:

AZURE_DEPLOY_ENABLED=true

The federated subject is:
$OIDC_SUBJECT

No Azure client secret was created or stored.
EOF
