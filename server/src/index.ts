import express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import { existsSync } from 'fs'
import { resolve, join } from 'path'

import { trpcRouter } from './router'
import { setup } from './setup'
import { scheduledTasks } from './scheduledTasks'
import { setupLogger } from './utils'
const logger = setupLogger('server')

const uiPath = resolve(__dirname, 'ui')
const app = express()

;(async () => {
  await setup()

  // We only want to serve the UI in production. In development, we will handle it
  // elsewhere
  if (existsSync(uiPath)) app.use(express.static(uiPath))
  else logger.info('UI not found, skipping static serving')

  app.use(express.json())
  app.use(cors())

  app.use(
    '/api/v1/',
    trpcExpress.createExpressMiddleware({
      router: trpcRouter,
    })
  )

  // Pass all unfound routes to the UI for react-router to handle
  app.get('*', (req, res) => {
    if (!existsSync(uiPath)) {
      res
        .status(504)
        .send('Server error: The UI has not been built with the server')

      logger.warn(
        'The UI has not been included with the server bundle. Here are some tips:'
      )
      logger.warn('1. If you are in development, use the react dev server')
      logger.warn(
        '2. Use an officially provided build (if this is an official build, file an issue on our repo)'
      )
      logger.warn(
        '3. If you are building it yourself, be sure to build the client and put in the `ui` folder, next to your index.js file'
      )

      return
    }

    res.sendFile(join(uiPath, 'index.html'))
  })

  const serverPort = process.env.PORT || 8080

  app.listen(serverPort, () =>
    logger.info(`Server listening on port ${serverPort}`)
  )

  const mins = 1
  // Start Immediately
  scheduledTasks()
  // and then loop
  setInterval(() => {
    scheduledTasks()
  }, mins * 60 * 1000)
})()
