#!/usr/bin/env bash
set -Eeuo pipefail

RESOURCE_GROUP="xcel360-prod"
ENVIRONMENT="xcel360-env"
APP_NAME="xcel360"
LOCATION="francecentral"
CONTAINER_NAME="xcel360-public"
IMAGE="ghcr.io/rexpect001/xcel360:sha-45b6a043ce6c53a456d6ad4f147150838d8be116"
ENV_FILE="${1:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE was not found. Upload .env.local to Cloud Shell first." >&2
  exit 1
fi

# Parse dotenv syntax without printing values. shlex.quote makes the generated
# exports safe even when passwords or URLs contain shell metacharacters.
eval "$(
  python3 - "$ENV_FILE" <<'PY'
import re
import shlex
import sys
from pathlib import Path

path = Path(sys.argv[1])
for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    if not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
        continue
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    print(f"export {key}={shlex.quote(value)}")
PY
)"

for required in DATABASE_URL DIRECT_URL NEXTAUTH_SECRET; do
  if [[ ! -v "$required" || -z "${!required}" ]]; then
    echo "ERROR: $required is missing or empty in $ENV_FILE." >&2
    exit 1
  fi
done

if [[ ! -v CRON_SECRET || -z "$CRON_SECRET" ]]; then
  export CRON_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
fi

echo "Registering Azure resource providers..."
az provider register --namespace Microsoft.Storage --wait

STORAGE_NAME="$(
  az storage account list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?starts_with(name, 'xcel360prod')].name | [0]" \
    --output tsv
)"

if [[ -z "$STORAGE_NAME" ]]; then
  while true; do
    CANDIDATE="xcel360prod$(openssl rand -hex 3)"
    AVAILABLE="$(az storage account check-name --name "$CANDIDATE" --query nameAvailable --output tsv)"
    if [[ "$AVAILABLE" == "true" ]]; then
      STORAGE_NAME="$CANDIDATE"
      break
    fi
  done

  echo "Creating storage account $STORAGE_NAME in $LOCATION..."
  az storage account create \
    --name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --allow-blob-public-access true \
    --min-tls-version TLS1_2 \
    --https-only true \
    --output none
else
  echo "Reusing storage account $STORAGE_NAME..."
  az storage account update \
    --name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --allow-blob-public-access true \
    --min-tls-version TLS1_2 \
    --https-only true \
    --output none
fi

STORAGE_KEY="$(
  az storage account keys list \
    --account-name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query '[0].value' \
    --output tsv
)"

az storage container create \
  --name "$CONTAINER_NAME" \
  --account-name "$STORAGE_NAME" \
  --account-key "$STORAGE_KEY" \
  --public-access blob \
  --output none

export AZURE_STORAGE_CONNECTION_STRING="$(
  az storage account show-connection-string \
    --name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv
)"
export AZURE_STORAGE_CONTAINER="$CONTAINER_NAME"

secrets=()
env_vars=(
  "NODE_ENV=production"
  "NEXT_TELEMETRY_DISABLED=1"
  "NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-Xcel360}"
  "AZURE_STORAGE_CONTAINER=$AZURE_STORAGE_CONTAINER"
)

add_secret() {
  local secret_name="$1"
  local env_name="$2"
  local value=""

  if [[ -v "$env_name" ]]; then
    value="${!env_name}"
  fi

  if [[ -n "$value" ]]; then
    secrets+=("$secret_name=$value")
    env_vars+=("$env_name=secretref:$secret_name")
  fi
}

add_secret database-url DATABASE_URL
add_secret direct-url DIRECT_URL
add_secret nextauth-secret NEXTAUTH_SECRET
add_secret google-client-id GOOGLE_CLIENT_ID
add_secret google-client-secret GOOGLE_CLIENT_SECRET
add_secret storage-connection AZURE_STORAGE_CONNECTION_STRING
add_secret cron-secret CRON_SECRET
add_secret anthropic-api-key ANTHROPIC_API_KEY
add_secret gemini-api-key GEMINI_API_KEY
add_secret serper-api-key SERPER_API_KEY
add_secret tools-secret TOOLS_SECRET
add_secret paystack-secret PAYSTACK_SECRET_KEY
add_secret resend-api-key RESEND_API_KEY
add_secret sendchamp-api-key SENDCHAMP_API_KEY
add_secret gmail-user GMAIL_USER
add_secret gmail-password GMAIL_APP_PASSWORD
add_secret xcel-gmail-user XCEL_GMAIL_USER
add_secret xcel-gmail-password XCEL_GMAIL_APP_PASSWORD
add_secret email-server-host EMAIL_SERVER_HOST
add_secret email-server-port EMAIL_SERVER_PORT
add_secret email-server-user EMAIL_SERVER_USER
add_secret email-server-password EMAIL_SERVER_PASSWORD
add_secret email-from EMAIL_FROM
add_secret contact-inbox CONTACT_INBOX
add_secret admin-email ADMIN_EMAIL
add_secret smartsms-token SMARTSMS_TOKEN

echo "Creating or updating Azure Container App $APP_NAME..."
if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az containerapp secret set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --secrets "${secrets[@]}" \
    --output none

  az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE" \
    --cpu 0.5 \
    --memory 1Gi \
    --min-replicas 0 \
    --max-replicas 2 \
    --set-env-vars "${env_vars[@]}" \
    --output none

  az containerapp ingress enable \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --type external \
    --target-port 3000 \
    --transport auto \
    --output none
else
  az containerapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT" \
    --image "$IMAGE" \
    --ingress external \
    --target-port 3000 \
    --transport auto \
    --cpu 0.5 \
    --memory 1Gi \
    --min-replicas 0 \
    --max-replicas 2 \
    --secrets "${secrets[@]}" \
    --env-vars "${env_vars[@]}" \
    --output none
fi

FQDN="$(
  az containerapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.configuration.ingress.fqdn \
    --output tsv
)"
APP_URL="https://$FQDN"

az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars \
    "NEXTAUTH_URL=$APP_URL" \
    "NEXT_PUBLIC_APP_URL=$APP_URL" \
  --output none

# The values now live in Container Apps secrets. Remove the uploaded plaintext
# file and clear sensitive shell variables before testing the endpoint.
rm -f -- "$ENV_FILE"
unset STORAGE_KEY AZURE_STORAGE_CONNECTION_STRING
for variable in DATABASE_URL DIRECT_URL NEXTAUTH_SECRET GOOGLE_CLIENT_SECRET \
  CRON_SECRET ANTHROPIC_API_KEY GEMINI_API_KEY SERPER_API_KEY TOOLS_SECRET \
  PAYSTACK_SECRET_KEY RESEND_API_KEY SENDCHAMP_API_KEY GMAIL_APP_PASSWORD \
  XCEL_GMAIL_APP_PASSWORD EMAIL_SERVER_PASSWORD SMARTSMS_TOKEN; do
  unset "$variable" 2>/dev/null || true
done

echo "Waiting for the public endpoint..."
HTTP_STATUS="000"
for _ in {1..18}; do
  HTTP_STATUS="$(
    curl --location --silent --show-error \
      --output /dev/null \
      --write-out '%{http_code}' \
      --max-time 30 \
      "$APP_URL/" || true
  )"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    break
  fi
  sleep 10
done

PROVISIONING_STATE="$(
  az containerapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.provisioningState \
    --output tsv
)"

echo
echo "DEPLOYMENT RESULT"
echo "App URL: $APP_URL"
echo "HTTP status: $HTTP_STATUS"
echo "Provisioning: $PROVISIONING_STATE"
echo "Storage account: $STORAGE_NAME"

if [[ "$HTTP_STATUS" != "200" || "$PROVISIONING_STATE" != "Succeeded" ]]; then
  echo "Deployment needs diagnosis; do not change DNS yet." >&2
  exit 1
fi
