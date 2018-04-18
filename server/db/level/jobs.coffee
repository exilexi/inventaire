CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
levelBase = require './base'

module.exports =
  # always return an object with a 'push' function
  # taking two arguments; a payload and an error logger function
  initQueue: (jobName, worker, maxConcurrency)->
    db = levelBase.sub "job:#{jobName}"

    _.type CONFIG.runJobsInQueue[jobName], 'boolean'
    # Push & run jobs to queue if this job is enabled in config
    if CONFIG.runJobsInQueue[jobName]
      JobQueueServerAndClient = require 'level-jobs'
      _.info "#{jobName} job in server & client mode"
      return JobQueueServerAndClient db, worker, maxConcurrency

    # Otherwise, only push jobs to the queue, let another process run the jobs
    # See https://github.com/pgte/level-jobs#client-isolated-api
    # Typically used in prod to let the alt-instance run the jobs
    # and let the main instance focus on answering user requests
    else
      JobsQueueClient = require 'level-jobs/client'
      _.info "#{jobName} job in client mode"
      return JobsQueueClient db
