import logger from '@adonisjs/core/services/logger'
import scheduler from '@outloud/adonis-scheduler/services/main'

scheduler.onError((error, task) => {
  logger.error({ err: error, task: task.name }, 'Scheduled task failed')
})
