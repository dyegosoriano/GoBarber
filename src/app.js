import express from 'express'
import { resolve } from 'path'
import Youch from 'youch'
import * as Sentry from '@sentry/node'
import 'express-async-errors'

import routes from './routes'
import sentryConfig from './config/sentry'

import './database'

class App {
  constructor () {
    this.server = express()

    Sentry.init(sentryConfig)

    this.middlewares()
    this.routes()
    this.exceptionHandler()
  }

  middlewares () {
    this.server.use(Sentry.Handlers.requestHandler())
    this.server.use(express.json())
    // Usando método Static para habilitar a visualização de arquivos do servidor
    this.server.use('/files', express.static(resolve(__dirname, '..', 'tmp', 'uploads')))
  }

  routes () {
    this.server.use(routes)
    this.server.use(Sentry.Handlers.errorHandler())
  }

  exceptionHandler () {
    this.server.use(async (err, request, response, next) => {
      const errors = await new Youch(err, request).toJSON()

      return response.status(500).json(errors)
    })
  }
}

export default new App().server
