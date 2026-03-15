# Azure Deployment Configuration Guide

## Overview

This guide documents the migration of HomeEssentials microservices from AWS to Microsoft Azure. The system now uses Azure Container Apps for container orchestration, Azure Container Registry for image storage, and Azure Key Vault for secrets management.

## AWS to Azure Service Mapping

| AWS Service | Purpose | Azure Equivalent |
|-------------|---------|------------------|
| **ECR** (Elastic Container Registry) | Docker image storage & registry | **ACR** (Azure Container Registry) |
| **ECS Fargate** | Containerized application deployment | **Azure Container Apps** |
| **Secrets Manager** | Secrets and sensitive data management | **Azure Key Vault** |
| **CloudWatch Logs** | Log aggregation and monitoring | **Azure Monitor** / **Log Analytics** |
| **IAM Roles & Policies** | Access control and authentication | **Azure AD** / **Managed Identities** |
| **CloudFormation** | Infrastructure as Code | **Azure Resource Manager (ARM)** / **Bicep** |
| **RDS** | Managed database services | **Azure Database for MySQL/PostgreSQL** |
| **S3** | Object storage | **Azure Blob Storage** |

## Prerequisites

Before deploying to Azure, ensure you have:

1. **Azure Subscription**: An active Azure subscription
2. **Azure CLI**: Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Required Azure Resources Created**:
   - Resource Group: `homeessentials-rg`
   - Container Registry: `homeessentialsacr`
   - Container Apps Environment: `homeessentials`
   - Key Vault: `homeessentials-kv`
   - Log Analytics Workspace: `homeessentials-logs`

## GitHub Secrets Configuration

For the CI/CD pipelines to work with Azure, configure the following GitHub secrets:

```
AZURE_CREDENTIALS         - Azure service principal credentials (JSON format)
AZURE_REGISTRY_NAME       - Name of your Azure Container Registry (e.g., homeessentialsacr)
AZURE_REGISTRY_LOGIN_SERVER - Login server URL (e.g., homeessentialsacr.azurecr.io)
AZURE_REGISTRY_USERNAME   - ACR username
AZURE_REGISTRY_PASSWORD   - ACR password
```

### Creating Azure Credentials for GitHub

1. Create a service principal:
```bash
az ad sp create-for-rbac --name "HomeEssentials-CI-CD" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/homeessentials-rg
```

2. Copy the output JSON and set it as the `AZURE_CREDENTIALS` secret in GitHub

## Azure Resources Setup

### 1. Create Resource Group

```bash
az group create \
  --name homeessentials-rg \
  --location eastus
```

### 2. Create Azure Container Registry

```bash
az acr create \
  --resource-group homeessentials-rg \
  --name homeessentialsacr \
  --sku Basic
```

### 3. Create Container Apps Environment

```bash
az containerapp env create \
  --name homeessentials \
  --resource-group homeessentials-rg \
  --location eastus
```

### 4. Create Log Analytics Workspace

```bash
az monitor log-analytics workspace create \
  --resource-group homeessentials-rg \
  --workspace-name homeessentials-logs \
  --location eastus
```

### 5. Create Azure Key Vault

```bash
az keyvault create \
  --name homeessentials-kv \
  --resource-group homeessentials-rg \
  --location eastus \
  --enable-rbac-authorization
```

### 6. Add Secrets to Key Vault

```bash
# MongoDB URI
az keyvault secret set \
  --vault-name homeessentials-kv \
  --name mongodb-uri \
  --value "mongodb://username:password@host:port/database"

# ACR Password
az keyvault secret set \
  --vault-name homeessentials-kv \
  --name acr-password \
  --value "your-acr-password"
```

## CI/CD Pipeline Changes

The GitHub workflows have been updated to:

1. **Build Stage**:
   - Log in to Azure Container Registry using provided credentials
   - Build Docker images
   - Push images to ACR (instead of ECR)
   - Scan images with Trivy for security vulnerabilities

2. **Deploy Stage**:
   - Authenticate using Azure credentials
   - Deploy to Azure Container Apps (instead of ECS)
   - Configure environment variables and secrets
   - Enable ingress for external access

### Workflow Files

- `.github/workflows/inventory-service-ci-cd.yml`
- `.github/workflows/product-service-ci-cd.yml`

## Container App Configuration

Each microservice has an Azure Container Apps configuration file:

- `inventory-service/azure-container-app.yaml`
- `product-service/azure-container-app.yaml`

These files define:
- Container specifications
- CPU and memory resources (0.5 CPU, 1GB memory)
- Environment variables
- Health checks (liveness and readiness probes)
- Autoscaling rules (1-3 replicas based on HTTP requests)
- Ingress configuration for external access
- Secret references to Key Vault

## Deployment Process

### Manual Deployment

To manually deploy a service to Azure Container Apps:

```bash
# Set variables
RESOURCE_GROUP="homeessentials-rg"
ENVIRONMENT="homeessentials"
APP_NAME="inventory-service"

# Deploy using ARM template or CLI
az containerapp create \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --name $APP_NAME \
  --image homeessentialsacr.azurecr.io/homeessentials-inventory-service:latest \
  --target-port 3003 \
  --registry-login-server homeessentialsacr.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

### Automated Deployment via CI/CD

When you push to the `main` branch:

1. Code is tested and analyzed
2. Docker image is built and pushed to ACR
3. Container App is automatically updated with the new image
4. Service is deployed with zero downtime

## Monitoring and Logging

### Azure Monitor

Access logs and metrics via Azure Portal:

1. Navigate to your Container App
2. Select "Monitoring" > "Logs"
3. Query logs using KQL (Kusto Query Language)

### Example Queries

```kuql
# View recent activity
ContainerAppActivity
| take 100

# View error logs
ContainerAppConsoleLogs
| where LogLevel == "ERROR"
| order by TimeGenerated desc

# View incoming requests
requests
| where success == false
| order by timestamp desc
```

## Environment Variables

### Inventory Service (Port 3003)

```
NODE_ENV=production
PORT=3003
PRODUCT_SERVICE_URL=http://product-service.homeessentials.local:3002
MONGODB_URI=(from Key Vault)
```

### Product Service (Port 3002)

```
NODE_ENV=production
PORT=3002
INVENTORY_SERVICE_URL=http://inventory-service.homeessentials.local:3003
MONGODB_URI=(from Key Vault)
```

## Database Configuration

For MongoDB:

1. Use [Azure Cosmos DB for MongoDB](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/mongodb-introduction) as a managed service
2. Or maintain your existing MongoDB instance and update connection strings in Key Vault

## Cost Optimization

- **Container Apps**: Scale down during non-business hours using scheduled scale rules
- **ACR**: Use Basic tier for development, Standard for production
- **Key Vault**: Monitor API calls to optimize costs
- **Log Analytics**: Adjust retention policy and data ingestion limits

## Troubleshooting

### Common Issues

1. **Image Pull Errors**
   - Verify ACR credentials in Key Vault
   - Check image name and tag are correct in Container App configuration
   - Ensure Container App has sufficient permissions to pull images

2. **Connection Issues**
   - Verify service names in environment variables
   - Check Container Apps Environment networking settings
   - Ensure Health Check endpoints are returning 200 status

3. **Secret Access Errors**
   - Verify managed identity has permissions to Key Vault
   - Check secret names and reference format in Container App
   - Use `az keyvault secret list` to verify secrets exist

## Support and Documentation

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Container Registry Documentation](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Key Vault Documentation](https://learn.microsoft.com/en-us/azure/key-vault/)
- [Azure Monitor Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/)

## Next Steps

After successful deployment:

1. Test all service endpoints
2. Configure custom domains and SSL certificates
3. Set up backup and disaster recovery policies
4. Implement cost monitoring and budgets
5. Configure Azure DevOps or GitHub Actions for advanced CI/CD scenarios
