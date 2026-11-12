@description('Deployed Xcel360 origin, without a trailing slash.')
param appBaseUrl string

@secure()
@description('Must match the CRON_SECRET environment variable in Azure Container Apps.')
param cronSecret string

param location string = 'francecentral'

var jobs = [
  {
    name: 'xcel360-daily'
    path: '/api/cron/daily'
    frequency: 'Day'
    interval: 1
    hour: 6
    minute: 17
  }
  {
    name: 'xcel360-auto-discover'
    path: '/api/cron/auto-discover'
    frequency: 'Day'
    interval: 1
    hour: 5
    minute: 43
  }
]

resource cronWorkflows 'Microsoft.Logic/workflows@2019-05-01' = [for job in jobs: {
  name: job.name
  location: location
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {}
      triggers: {
        schedule: {
          type: 'Recurrence'
          recurrence: {
            frequency: job.frequency
            interval: job.interval
            timeZone: 'UTC'
            schedule: {
              hours: [job.hour]
              minutes: [job.minute]
            }
          }
        }
      }
      actions: {
        call_xcel360: {
          type: 'Http'
          inputs: {
            method: 'GET'
            uri: '${appBaseUrl}${job.path}'
            headers: {
              Authorization: 'Bearer ${cronSecret}'
            }
          }
          runAfter: {}
          runtimeConfiguration: {
            secureData: {
              properties: [
                'inputs'
                'outputs'
              ]
            }
          }
        }
      }
      outputs: {}
    }
    parameters: {}
  }
}]

output workflowNames array = [for workflow in cronWorkflows: workflow.name]
