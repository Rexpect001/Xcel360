@description('Globally unique, lowercase storage account name (3-24 characters).')
param storageAccountName string

@description('Public container used by Xcel360 uploads.')
param containerName string = 'xcel360-public'

@description('Azure region for the storage account.')
param location string = 'francecentral'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource publicContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'Blob'
  }
}

output blobEndpoint string = storage.properties.primaryEndpoints.blob
output container string = publicContainer.name
