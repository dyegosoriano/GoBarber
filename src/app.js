import express from 'express'
import { resolve } from 'path'
import routes from './routes'

import './database'

class App {
  constructor () {
    this.server = express()

    this.middlewares()
    this.routes()
  }

  middlewares () {
    this.server.use(express.json())
    // Usando método Static para habilitar a visualização de arquivos do servidor
    this.server.use('/files', express.static(resolve(__dirname, '..', 'tmp', 'uploads')))
  }

  routes () {
    this.server.use(routes)
  }
}

export default new App().server
