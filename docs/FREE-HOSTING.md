# Running Xcel360 on Microsoft Azure

Xcel360 runs as a standalone Next.js server on Azure Container Apps. The Azure
for Students policy attached to this subscription does not allow any region in
which Azure Static Web Apps is available, so Container Apps Consumption in
France Central is used instead.

## Target architecture

| Piece | Service | Cost posture |
|---|---|---|
| Next.js application | Azure Container Apps Consumption | Scales to zero; monthly consumption grants apply |
| Container image | GitHub Container Registry, public package | Avoids the fixed Azure Container Registry charge |
| File storage | Azure Blob Storage, Standard LRS | Usage based |
| Scheduled jobs | Azure Logic Apps, Consumption | Usage based |
| PostgreSQL | Existing Supabase database | Unchanged |
| DNS and TLS | Azure Container Apps custom domain | Managed certificate |

The Azure resources are in resource group `xcel360-prod`. The Container Apps
environment is `xcel360-env` in `francecentral`, with application logging set
to `none` so a Log Analytics workspace is not created automatically.

## Container build

`.github/workflows/azure-container-apps.yml` builds the Dockerfile on pushes to
`main` and publishes these Linux/AMD64 image tags:

- `ghcr.io/rexpect001/xcel360:latest`
- `ghcr.io/rexpect001/xcel360:sha-<full-commit-sha>`

After its first successful run, set the `xcel360` package visibility to Public
in GitHub. This lets Azure pull the image without a long-lived GitHub token.

Do not put production secrets in the Dockerfile, workflow, image, or GitHub
package. Configure them as Container Apps environment variables.

## Runtime configuration

Configure the production values currently used by Vercel. At minimum:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`
- `CRON_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` when Google sign-in is enabled
- the active email settings and `EMAIL_FROM`, `CONTACT_INBOX`
- API keys for enabled AI and search features
- `PAYSTACK_SECRET_KEY` and `TOOLS_SECRET` when those features are enabled
- the active `NEXT_PUBLIC_ADSENSE_*` values

Container Apps must expose port `3000`, use external ingress, and have minimum
replicas set to `0`. The container listens on `0.0.0.0:3000`.

## Azure Blob Storage

Deploy storage in an allowed region:

```bash
az deployment group create \
  --resource-group xcel360-prod \
  --template-file infra/storage.bicep \
  --parameters storageAccountName=<globally-unique-lowercase-name>
```

From the storage account access keys, configure
`AZURE_STORAGE_CONNECTION_STRING`; set
`AZURE_STORAGE_CONTAINER=xcel360-public`.

Keep Vercel Blob available while copying existing files. With production
database and Azure storage values in `.env.local`, preview and apply:

```bash
node scripts/migrate-vercel-blobs.mjs
node scripts/migrate-vercel-blobs.mjs --apply
```

The script does not delete the source Vercel objects.

## Scheduled jobs

After the Azure hostname is live, deploy the two protected schedules:

```bash
az deployment group create \
  --resource-group xcel360-prod \
  --template-file infra/cron-workflows.bicep \
  --parameters appBaseUrl=https://<azure-hostname> cronSecret=<CRON_SECRET>
```

The schedules call `/api/cron/daily` at 06:17 UTC and
`/api/cron/auto-discover` at 05:43 UTC.

## Domain cutover and rollback

Test the generated `azurecontainerapps.io` hostname before adding
`thexcel360.com` and `www.thexcel360.com`. Add the DNS records Azure requests,
wait for validation and the managed certificate, then update OAuth and webhook
callback settings if needed.

Keep the Vercel project and old Blob objects for at least 48 hours after DNS
cutover. Rollback remains a DNS change because the database is shared and the
file migration preserves the old objects.
