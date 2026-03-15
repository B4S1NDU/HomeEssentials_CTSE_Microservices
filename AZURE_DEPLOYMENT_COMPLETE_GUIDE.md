# Complete Azure Deployment Guide - HomeEssentials Microservices

**Version**: 1.0  
**Last Updated**: March 15, 2026  
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Azure Account Setup](#phase-1-azure-account-setup)
3. [Phase 2: Prerequisites & Tools Installation](#phase-2-prerequisites--tools-installation)
4. [Phase 3: Azure CLI Login](#phase-3-azure-cli-login)
5. [Phase 4: Create Azure Infrastructure](#phase-4-create-azure-infrastructure)
6. [Phase 5: Configure Secrets & Key Vault](#phase-5-configure-secrets--key-vault)
7. [Phase 6: Create Service Principal for GitHub](#phase-6-create-service-principal-for-github)
8. [Phase 7: Configure GitHub Secrets](#phase-7-configure-github-secrets)
9. [Phase 8: Deploy Microservices](#phase-8-deploy-microservices)
10. [Phase 9: Verify Deployment](#phase-9-verify-deployment)
11. [Phase 10: Monitor & Troubleshoot](#phase-10-monitor--troubleshoot)

---

## Overview

This guide provides **step-by-step instructions** to deploy all 6 HomeEssentials microservices to Microsoft Azure Container Apps. The process involves:

- Setting up an Azure education account (100 free credits)
- Creating cloud infrastructure (Container Registry, Container Apps Environment, Key Vault)
- Configuring CI/CD pipelines with GitHub Actions
- Automating deployment on every code push
- Monitoring and managing deployed services

**Architecture:**
```
GitHub Repository
    ↓
GitHub Actions CI/CD (3 stages: Quality → Build → Deploy)
    ↓
Azure Container Registry (ACR) - Docker image storage
    ↓
Azure Container Apps - Deployed microservices running
    ↓
Azure Key Vault - Secure secrets storage
    ↓
Log Analytics - Monitoring & logging
```

---

## Phase 1: Azure Account Setup

### Step 1.1: Create Azure Education Account

If you don't have an Azure account, create your education account:

1. **Visit Azure for Students**: https://azure.microsoft.com/free/students/
2. **Click "Activate Now"** or **"Start Free"**
3. Sign in with your **school email** (e.g., `your.email@my.sliit.lk`)
4. Fill in your profile information
5. **Choose your school/organization** (SLIIT - Sri Lanka Institute of Information Technology)
6. Accept terms and conditions
7. Click **"Start your free account"**

**Expected Result:**
- 100 USD free credits
- Valid for 12 months
- No credit card required initially

### Step 1.2: Verify Your Account

After account creation:

1. Check your email for verification link
2. Open https://portal.azure.com/
3. Sign in with your school credentials
4. **Verify subscription**: Should show "Azure for Students"
5. You're ready to proceed! ✅

**Troubleshooting:**
- Email not received? Check spam folder
- Verification failed? Try again or contact Azure support

---

## Phase 2: Prerequisites & Tools Installation

### Step 2.1: Check Prerequisites

Before starting, ensure you have:

**On Your Computer:**
- ✅ Windows 10 or later
- ✅ PowerShell 5.1 or higher
- ✅ Administrator access on your PC
- ✅ Internet connection

**External Services:**
- ✅ GitHub account (https://github.com/)
- ✅ MongoDB Atlas account with 3 databases created:
  - Product Service database
  - Inventory Service database  
  - User Service database
- ✅ MongoDB connection strings for each database

**Verify PowerShell Version:**

Open PowerShell and run:

```powershell
$PSVersionTable.PSVersion
```

Expected output: Version 5.1 or higher with Major = 5

### Step 2.2: Install Azure CLI

Azure CLI is the command-line tool to manage Azure resources.

**Installation Steps:**

1. **Open PowerShell as Administrator**
   - Right-click PowerShell icon → Select "Run as administrator"

2. **Run the installer command:**

```powershell
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile AzureCLI.msi; & AzureCLI.msi
```

3. **In the installer window:**
   - Click **"Install"**
   - Accept license agreement
   - Wait 2-3 minutes for installation
   - Click **"Finish"**

4. **Close all PowerShell windows completely**

5. **Open PowerShell again** (fresh session)

6. **Verify installation:**

```powershell
az --version
```

Expected output:
```
azure-cli                      2.84.0 (or higher)
core                           2.84.0
...
Your CLI is up-to-date.
```

**Troubleshooting:**
- Error: "az command not found" → Close PowerShell and reopen completely
- On different OS? See: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

---

## Phase 3: Azure CLI Login

### Step 3.1: Authenticate with Azure

Now login to your Azure account via CLI:

```powershell
az login
```

**What happens:**
1. Your default browser opens automatically
2. You see an Azure login page
3. Sign in with your **school email and password**
4. Browser shows: "You have logged in to Microsoft Azure CLI"
5. Close the browser tab
6. Return to PowerShell

### Step 3.2: Verify Login Status

After browser closes, PowerShell should show:

```
[Tenant and subscription selection...]

No     Subscription name    Subscription ID                       Tenant
-----  -------------------  ------------------------------------  ----------
[1] *  Azure for Students   357bed5e-5f33-4a60-aacc-8f32852f04b2  SLIIT

Select a subscription (Enter for default):
```

**Just press Enter** to accept the default (marked with `*`)

### Step 3.3: Save Your Subscription ID

Run this to view your account details:

```powershell
az account show
```

Expected output:
```json
{
  "environmentName": "AzureCloud",
  "id": "357bed5e-5f33-4a60-aacc-8f32852f04b2",
  "name": "Azure for Students",
  "state": "Enabled",
  ...
}
```

**Save your Subscription ID** (the "id" value) - you'll need it later. Format:
```
SUBSCRIPTION_ID = 357bed5e-5f33-4a60-aacc-8f32852f04b2
```

---

## Phase 4: Create Azure Infrastructure

### Step 4.1: Create Resource Group

A resource group is a **container** for all your Azure resources.

```powershell
$resourceGroup = "homeessentials-rg"
$location = "eastus"

az group create `
  --name $resourceGroup `
  --location $location
```

Expected output:
```json
{
  "id": "/subscriptions/.../resourceGroups/homeessentials-rg",
  "location": "eastus",
  "name": "homeessentials-rg",
  "properties": {
    "provisioningState": "Succeeded"
  }
}
```

✅ **Resource Group Created**

### Step 4.2: Create Azure Container Registry (ACR)

ACR stores your Docker container images.

```powershell
$acrName = "homeessentialsacr"

az acr create `
  --resource-group $resourceGroup `
  --name $acrName `
  --sku Basic
```

Expected output:
```json
{
  "adminUserEnabled": false,
  "id": "/subscriptions/.../registries/homeessentialsacr",
  "location": "eastus",
  "name": "homeessentialsacr",
  "provisioningState": "Succeeded"
}
```

✅ **Container Registry Created**

### Step 4.3: Enable ACR Admin Access

Allow GitHub Actions to access the registry:

```powershell
az acr update `
  --resource-group $resourceGroup `
  --name $acrName `
  --admin-enabled true
```

### Step 4.4: Get ACR Credentials

These credentials authenticate Docker image push/pull:

```powershell
$acrCredentials = az acr credential show `
  --resource-group $resourceGroup `
  --name $acrName | ConvertFrom-Json

Write-Host "======== ACR CREDENTIALS ========"
Write-Host "Login Server: $($acrCredentials.loginServer)"
Write-Host "Username: $($acrCredentials.username)"
Write-Host "Password: $($acrCredentials.passwords[0].value)"
Write-Host "================================="
```

**Save these values** (you'll need them for GitHub):
```
ACR_LOGIN_SERVER = homeessentialsacr.azurecr.io
ACR_USERNAME = homeessentialsacr
ACR_PASSWORD = xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4.5: Create Log Analytics Workspace

For monitoring and logging:

```powershell
$logWorkspaceName = "homeessentials-logs"

az monitor log-analytics workspace create `
  --resource-group $resourceGroup `
  --workspace-name $logWorkspaceName `
  --location $location
```

### Step 4.6: Get Log Analytics Workspace ID

```powershell
$logWorkspaceId = az monitor log-analytics workspace show `
  --resource-group $resourceGroup `
  --workspace-name $logWorkspaceName `
  --query id -o tsv

Write-Host "Log Workspace ID: $logWorkspaceId"
```

**Save this ID** - you'll use it in the next step

### Step 4.7: Create Container Apps Environment

This is where your microservices will run:

```powershell
$containerAppEnv = "homeessentials"

az containerapp env create `
  --name $containerAppEnv `
  --resource-group $resourceGroup `
  --logs-workspace-id $logWorkspaceId `
  --location $location
```

**This may take 2-3 minutes. Wait for:**
```
{
  "id": "/subscriptions/.../containerApps/homeessentials",
  "name": "homeessentials",
  "provisioningState": "Succeeded"
}
```

✅ **Container Apps Environment Created**

### Step 4.8: Create Azure Key Vault

Key Vault securely stores secrets (database URIs, passwords):

```powershell
$keyVaultName = "homeessentials-kv-$(Get-Random -Minimum 1000 -Maximum 9999)"

az keyvault create `
  --resource-group $resourceGroup `
  --name $keyVaultName `
  --location $location `
  --sku standard
```

Expected output:
```json
{
  "id": "/subscriptions/.../vaults/homeessentials-kv-xxxx",
  "name": "homeessentials-kv-xxxx",
  "provisioningState": "Succeeded"
}
```

**Save the Key Vault name** from output

---

## Phase 5: Configure Secrets & Key Vault

### Step 5.1: Add MongoDB Database URIs

Store your MongoDB connection strings securely in Key Vault:

```powershell
# Replace with your actual MongoDB Atlas URIs
$productDbUri = "mongodb+srv://username:password@cluster.mongodb.net/product?retryWrites=true&w=majority"
$inventoryDbUri = "mongodb+srv://username:password@cluster.mongodb.net/inventory?retryWrites=true&w=majority"
$userDbUri = "mongodb+srv://username:password@cluster.mongodb.net/user?retryWrites=true&w=majority"

# Add Product Service URI
az keyvault secret set `
  --vault-name $keyVaultName `
  --name "ProductDbUri" `
  --value $productDbUri

# Add Inventory Service URI
az keyvault secret set `
  --vault-name $keyVaultName `
  --name "InventoryDbUri" `
  --value $inventoryDbUri

# Add User Service URI
az keyvault secret set `
  --vault-name $keyVaultName `
  --name "UserDbUri" `
  --value $userDbUri
```

### Step 5.2: Add ACR Password to Key Vault

```powershell
az keyvault secret set `
  --vault-name $keyVaultName `
  --name "AcrPassword" `
  --value $acrCredentials.passwords[0].value
```

### Step 5.3: Verify Secrets Were Added

```powershell
az keyvault secret list --vault-name $keyVaultName --query [].name
```

Expected output:
```json
[
  "AcrPassword",
  "InventoryDbUri",
  "ProductDbUri",
  "UserDbUri"
]
```

✅ **All secrets stored securely**

---

## Phase 6: Create Service Principal for GitHub

Service Principal allows GitHub Actions to deploy to Azure without storing credentials in GitHub.

### Step 6.1: Create Service Principal

Replace `SUBSCRIPTION_ID` with your actual subscription ID from Phase 3:

```powershell
$subscriptionId = "357bed5e-5f33-4a60-aacc-8f32852f04b2"  # Replace with yours

$servicePrincipal = az ad sp create-for-rbac `
  --name "github-homeessentials" `
  --role "Contributor" `
  --scopes "/subscriptions/$subscriptionId" | ConvertFrom-Json

Write-Host "===== SAVE THIS ENTIRE JSON BELOW ====="
$servicePrincipal | ConvertTo-Json
Write-Host "===== END OF JSON ====="
```

**Output will look like:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "github-homeessentials",
  "password": "xxxxxxxx~xxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Step 6.2: Copy the JSON

**Copy the ENTIRE JSON block above.** You'll paste this as a GitHub secret in Phase 7.

---

## Phase 7: Configure GitHub Secrets

GitHub Secrets store sensitive values that your CI/CD pipelines need.

### Step 7.1: Navigate to GitHub Repository

1. Go to your GitHub repository: https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices
2. Click **Settings** (top menu)
3. In left sidebar, click **Secrets and variables** → **Actions**

### Step 7.2: Create 5 GitHub Secrets

**Secret 1: AZURE_CREDENTIALS**
1. Click **"New repository secret"**
2. Name: `AZURE_CREDENTIALS`
3. Value: **Paste the entire JSON from Phase 6.2**
4. Click **"Add secret"**

**Secret 2: AZURE_REGISTRY_NAME**
1. Click **"New repository secret"**
2. Name: `AZURE_REGISTRY_NAME`
3. Value: `homeessentialsacr`
4. Click **"Add secret"**

**Secret 3: AZURE_REGISTRY_LOGIN_SERVER**
1. Click **"New repository secret"**
2. Name: `AZURE_REGISTRY_LOGIN_SERVER`
3. Value: (from Phase 4.4) - e.g., `homeessentialsacr.azurecr.io`
4. Click **"Add secret"**

**Secret 4: AZURE_REGISTRY_USERNAME**
1. Click **"New repository secret"**
2. Name: `AZURE_REGISTRY_USERNAME`
3. Value: (from Phase 4.4) - e.g., `homeessentialsacr`
4. Click **"Add secret"**

**Secret 5: AZURE_REGISTRY_PASSWORD**
1. Click **"New repository secret"**
2. Name: `AZURE_REGISTRY_PASSWORD`
3. Value: (from Phase 4.4) - the password value
4. Click **"Add secret"**

### Step 7.3: Verify Secrets Added

After adding all 5 secrets, verify they appear:
- ✅ AZURE_CREDENTIALS
- ✅ AZURE_REGISTRY_NAME
- ✅ AZURE_REGISTRY_LOGIN_SERVER
- ✅ AZURE_REGISTRY_USERNAME
- ✅ AZURE_REGISTRY_PASSWORD

All should show "Last used: just now" after you add them.

---

## Phase 8: Deploy Microservices

### Option A: Automatic Deployment (Recommended)

GitHub Actions automatically deploys when you push code to main branch:

```powershell
# Navigate to your repository
cd c:\Users\User\Documents\HomeEssentials_CTSE\HomeEssentials_CTSE_Microservices

# Stage all changes
git add .

# Commit with a message
git commit -m "Deploy to Azure"

# Push to main branch
git push origin main
```

**What happens automatically:**
1. GitHub Actions workflow triggers for each service
2. Code quality checks run (ESLint, Snyk, SonarCloud)
3. Docker images build
4. Images push to Azure Container Registry
5. Services deploy to Container Apps
6. **Takes 5-10 minutes per service**

**Watch deployment progress:**
1. Go to your GitHub repo
2. Click **"Actions"** tab
3. See running workflows for each service
4. Click any workflow to see detailed logs

### Option B: Manual Deployment (If Automated Fails)

Only use this if Option A fails:

```powershell
# Deploy Product Service
az containerapp create `
  --name "product-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-product-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3002 `
  --target-port 3002 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3

# Deploy Inventory Service
az containerapp create `
  --name "inventory-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-inventory-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3003 `
  --target-port 3003 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3

# Deploy User Service
az containerapp create `
  --name "user-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-user-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3001 `
  --target-port 3001 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3

# Deploy Order Service
az containerapp create `
  --name "order-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-order-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3004 `
  --target-port 3004 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3

# Deploy Payment Service
az containerapp create `
  --name "payment-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-payment-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3005 `
  --target-port 3005 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3

# Deploy Notification Service
az containerapp create `
  --name "notification-service" `
  --resource-group $resourceGroup `
  --environment $containerAppEnv `
  --image "$($acrCredentials.loginServer)/homeessentials-notification-service:latest" `
  --registry-login-server $acrCredentials.loginServer `
  --registry-username $acrCredentials.username `
  --registry-password $acrCredentials.passwords[0].value `
  --cpu 0.5 `
  --memory 1Gi `
  --env-vars PORT=3006 `
  --target-port 3006 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3
```

---

## Phase 9: Verify Deployment

### Step 9.1: Check All Services Are Running

```powershell
az containerapp list `
  --resource-group $resourceGroup `
  --query "[].{Name:name, Status:properties.provisioningState, URL:properties.configuration.ingress.fqdn}" `
  --output table
```

Expected output:
```
Name                    Status        URL
----------------------  -----------  ----------------------------------------
product-service         Succeeded    product-service.xxx.eastus.azurecontainerapps.io
inventory-service       Succeeded    inventory-service.xxx.eastus.azurecontainerapps.io
user-service            Succeeded    user-service.xxx.eastus.azurecontainerapps.io
order-service           Succeeded    order-service.xxx.eastus.azurecontainerapps.io
payment-service         Succeeded    payment-service.xxx.eastus.azurecontainerapps.io
notification-service    Succeeded    notification-service.xxx.eastus.azurecontainerapps.io
```

✅ **All services deployed and running**

### Step 9.2: Get Full URLs for Each Service

```powershell
$services = @("product-service", "inventory-service", "user-service", "order-service", "payment-service", "notification-service")

foreach ($service in $services) {
    $url = az containerapp show `
      --name $service `
      --resource-group $resourceGroup `
      --query properties.configuration.ingress.fqdn `
      -o tsv
    
    Write-Host "$service URL: https://$url"
}
```

Output:
```
product-service URL: https://product-service.xxx.eastus.azurecontainerapps.io
inventory-service URL: https://inventory-service.xxx.eastus.azurecontainerapps.io
user-service URL: https://user-service.xxx.eastus.azurecontainerapps.io
order-service URL: https://order-service.xxx.eastus.azurecontainerapps.io
payment-service URL: https://payment-service.xxx.eastus.azurecontainerapps.io
notification-service URL: https://notification-service.xxx.eastus.azurecontainerapps.io
```

**Save all these URLs** - you'll use them for testing

### Step 9.3: Test Health Endpoints

Test each service's health check endpoint:

```powershell
$services = @("product-service", "inventory-service", "user-service", "order-service", "payment-service", "notification-service")

foreach ($service in $services) {
    $url = az containerapp show `
      --name $service `
      --resource-group $resourceGroup `
      --query properties.configuration.ingress.fqdn `
      -o tsv
    
    try {
        $response = Invoke-WebRequest -Uri "https://$url/health" -Method GET -SkipCertificateCheck
        Write-Host "✅ $service: Status $($response.StatusCode)"
    } catch {
        Write-Host "❌ $service: Failed"
    }
}
```

Expected: All services return **Status 200**

### Step 9.4: Test API Endpoints

**Test Product Service API:**
```powershell
$url = "https://product-service.xxx.eastus.azurecontainerapps.io"
$response = Invoke-RestMethod -Uri "$url/api/products" -Method GET -SkipCertificateCheck
$response | ConvertTo-Json
```

**Test Inventory Service API:**
```powershell
$url = "https://inventory-service.xxx.eastus.azurecontainerapps.io"
$response = Invoke-RestMethod -Uri "$url/api/inventory" -Method GET -SkipCertificateCheck
$response | ConvertTo-Json
```

### Step 9.5: Test Inter-Service Communication

Test that services can call each other:

**Example: Order Service calling Product Service**

```powershell
$orderServiceUrl = "https://order-service.xxx.eastus.azurecontainerapps.io"

# Create test order that calls Product Service internally
$body = @{
    productId = "test-product-123"
    quantity = 5
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "$orderServiceUrl/api/orders" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -SkipCertificateCheck

Write-Host "Order created with inter-service communication: $response"
```

---

## Phase 10: Monitor & Troubleshoot

### Step 10.1: View Service Logs

**View logs for a specific service:**

```powershell
az containerapp logs show `
  --name "product-service" `
  --resource-group $resourceGroup `
  --follow
```

**Remove `--follow` flag if you just want recent logs (not streaming)**

### Step 10.2: Check Replica Status

See how many instances of each service are running:

```powershell
$services = @("product-service", "inventory-service", "user-service")

foreach ($service in $services) {
    $replicas = az containerapp replica list `
      --name $service `
      --resource-group $resourceGroup `
      --query "[].{Status:properties.runningState, CreatedTime:properties.createdTime}" `
      --output table
    
    Write-Host "`n=== $service Replicas ==="
    Write-Host $replicas
}
```

### Step 10.3: Common Issues & Solutions

#### Issue 1: Service Stuck in "Provisioning" State

**Symptom:** `provisioningState: "Provisioning"` for more than 5 minutes

**Solution:**
```powershell
# Check detailed status
az containerapp show `
  --name "product-service" `
  --resource-group $resourceGroup `
  --query properties.provisioningState

# View error events
az containerapp logs show `
  --name "product-service" `
  --resource-group $resourceGroup
```

#### Issue 2: Image Not Found in ACR

**Symptom:** Service fails to start with "image pull error"

**Solution:**
1. Verify image exists in ACR:
```powershell
az acr repository list `
  --name $acrName `
  --output table
```

2. Check if GitHub workflow pushed the image successfully:
   - Go to GitHub → Actions
   - Click the workflow that failed
   - Look for "Build & Push to ACR" section
   - Check if Docker build succeeded

#### Issue 3: Can't Access Service via HTTPS

**Symptom:** Connection timeout or refused

**Solution:**
```powershell
# Verify service has external ingress enabled
az containerapp show `
  --name "product-service" `
  --resource-group $resourceGroup `
  --query properties.configuration.ingress
```

Should show `"external": true` and valid `fqdn`

#### Issue 4: Service Returns 502 Bad Gateway

**Symptom:** URL works but returns error

**Solution:**
1. Check if service is running:
```powershell
az containerapp show `
  --name "product-service" `
  --resource-group $resourceGroup `
  --query properties.provisioningState
```

2. Check MongoDB connection:
```powershell
# Verify MongoDB URI is correct in Key Vault
az keyvault secret show `
  --vault-name $keyVaultName `
  --name "ProductDbUri"
```

3. View logs for error details:
```powershell
az containerapp logs show `
  --name "product-service" `
  --resource-group $resourceGroup `
  --follow
```

### Step 10.4: Monitor Azure Resources

**View resource costs:**
```powershell
# See estimated costs
az containerapp billing
```

**View resource usage:**
```powershell
# See metrics for a service
az monitor metrics list `
  --resource-group $resourceGroup `
  --resource-type "Microsoft.App/containerApps" `
  --resource-names "product-service"
```

---

## Quick Reference

### Environment Variables Summary

| Service | Port | Environment Variables |
|---------|------|---|
| **Product Service** | 3002 | `PORT=3002`, `MONGODB_URI` |
| **Inventory Service** | 3003 | `PORT=3003`, `MONGODB_URI`, `PRODUCT_SERVICE_URL` |
| **User Service** | 3001 | `PORT=3001`, `MONGODB_URI` |
| **Order Service** | 3004 | `PORT=3004`, `MONGODB_URI`, `PRODUCT_SERVICE_URL`, `INVENTORY_SERVICE_URL` |
| **Payment Service** | 3005 | `PORT=3005`, `MONGODB_URI` |
| **Notification Service** | 3006 | `PORT=3006`, `MONGODB_URI` |

### Azure Resources Created

| Resource | Name | Type |
|---|---|---|
| **Resource Group** | homeessentials-rg | Container |
| **Container Registry** | homeessentialsacr | ACR |
| **Container Apps Env** | homeessentials | Environment |
| **Log Analytics** | homeessentials-logs | Monitoring |
| **Key Vault** | homeessentials-kv-xxxx | Secrets |
| **Services** | product/inventory/user/order/payment/notification-service | Container Apps |

### Key Azure CLI Commands

```powershell
# Login
az login

# View current subscription
az account show

# List all container apps
az containerapp list --resource-group $resourceGroup

# View specific service
az containerapp show --name "product-service" --resource-group $resourceGroup

# View logs
az containerapp logs show --name "product-service" --resource-group $resourceGroup --follow

# Update service (e.g., after changing environment variables)
az containerapp update --name "product-service" --resource-group $resourceGroup --image-to-deploy "..."

# Delete entire resource group (WARNING: Deletes all resources)
az group delete --name $resourceGroup --yes --no-wait

# Get service URL
az containerapp show --name "product-service" --resource-group $resourceGroup --query properties.configuration.ingress.fqdn
```

---

## Demonstration Checklist for Viva

Use this checklist during your viva presentation:

```
☐ All 6 services show "Succeeded" status in Azure Portal
☐ Open browser and show all 6 service URLs working
☐ Call one service's API endpoint, show response
☐ Demonstrate inter-service communication (e.g., Order → Product)
☐ Show GitHub Actions workflow running (recent git push)
☐ Show CI/CD pipeline stages (Quality → Build → Deploy)
☐ Show logs in Azure Portal for recent deployment
☐ Explain security measures:
  ☐ GitHub Secrets (never expose credentials)
  ☐ Azure Key Vault (secure secrets storage)
  ☐ Role-based access control (RBAC)
  ☐ Network security (isolated Container Apps environment)
☐ Explain DevSecOps tools:
  ☐ SonarCloud (code quality)
  ☐ Snyk (dependency scanning)
  ☐ Trivy (container image scanning)
☐ Show Docker images in ACR
☐ Explain CPU/Memory scaling configuration
☐ Show monitoring dashboard in Log Analytics
```

---

## Cost Optimization Tips

1. **Scale Down During Off-Hours:**
```powershell
# Set minimum replicas to 0 during night
az containerapp update --name "product-service" --resource-group $resourceGroup --min-replicas 0
```

2. **Use Basic ACR Tier:** Already configured (saves costs vs Standard)

3. **Monitor Key Vault Usage:** Check for excessive API calls

4. **Set Log Retention:** Limit Log Analytics retention to 30 days to save costs

---

## Support & Additional Resources

### Official Documentation
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)

### GitHub Actions Documentation
- [GitHub Actions Workflows](https://docs.github.com/en/actions)
- [Azure Login Action](https://github.com/Azure/login)
- [Container Apps Deploy Action](https://github.com/Azure/container-apps-deploy-action)

---

## Rollback & Recovery

### If deployment fails:

```powershell
# Rollback to previous image
az containerapp update \
  --name "product-service" \
  --resource-group $resourceGroup \
  --image homeessentialsacr.azurecr.io/homeessentials-product-service:previous-tag
```

### If you need to delete everything:

```powershell
# WARNING: This deletes all resources!
az group delete --name homeessentials-rg --yes

# Then recreate from Phase 4 onward
```

---

## Summary: What You've Accomplished

✅ Created Azure education account with 100 free credits  
✅ Installed Azure CLI  
✅ Created Resource Group, Container Registry, Container Apps Environment  
✅ Set up Key Vault with secrets  
✅ Created Service Principal for GitHub  
✅ Configured 5 GitHub Secrets  
✅ Deployed all 6 microservices to Azure  
✅ Verified all services are running and accessible  
✅ Set up monitoring with Log Analytics  
✅ Configured CI/CD for automatic deployment on code push  

**You now have a production-ready microservices platform running on Azure Cloud!** 🎉

---

**Last Updated:** March 15, 2026  
**Version:** 1.0 - Complete  
**Status:** Ready for Production
