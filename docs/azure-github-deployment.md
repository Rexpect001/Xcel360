# GitHub-to-Azure deployment

The `Build and deploy Xcel360` workflow builds an immutable container image for
every push to `main`. Once deployment is enabled, the workflow authenticates to
Azure with OpenID Connect (OIDC), updates `xcel360-web`, runs a smoke test, and
automatically restores the previous image if deployment or verification fails.

No Azure password or client secret is stored in GitHub.

## One-time Azure setup

Run the following from Azure Cloud Shell after downloading the setup script:

```bash
bash scripts/setup-azure-github-oidc.sh
```

The script is idempotent. It creates or reuses the `xcel360-github-deploy`
user-assigned managed identity, grants the built-in `Container Apps Contributor`
role on `xcel360-prod`, and trusts only the `production` environment in
`Rexpect001/Xcel360`.

## One-time GitHub setup

1. Open the GitHub repository.
2. Go to **Settings > Environments** and create an environment named
   `production`.
3. Add the three environment secrets printed by the setup script:
   `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`.
4. Go to **Settings > Secrets and variables > Actions > Variables**.
5. Create `AZURE_DEPLOY_ENABLED` with the value `true`.
6. Open **Actions > Build and deploy Xcel360** and run the workflow, or push a
   commit to `main`.

The first Azure login can take a few minutes to work after role assignment
because Azure RBAC changes need time to propagate.

## Normal releases

After setup, every push to `main` performs these steps:

1. Build the Docker image.
2. Push both `latest` and the immutable `sha-<commit>` tag to GHCR.
3. Authenticate to Azure using the short-lived GitHub OIDC token.
4. Deploy the immutable image to `xcel360-web`.
5. Verify `/api/auth/providers` on the generated Azure hostname.
6. Restore the previous image automatically if deployment or verification
   fails.

To temporarily stop automatic deployment without deleting Azure credentials,
change `AZURE_DEPLOY_ENABLED` to `false` in GitHub Actions variables.
