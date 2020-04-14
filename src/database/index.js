import Sequelize from 'sequelize'
import mongoose from 'mongoose'

import User from '../app/models/User'
import File from '../app/models/File'
import Appointments from '../app/models/Appointment'

import databaseConfig from '../config/database'

const models = [User, File, Appointments]

class Database {
  constructor () {
    this.init()
    this.mongo()
  }

  // Método de conexão com o banco de dados
  init () {
    this.connection = new Sequelize(databaseConfig)

    models
      .map(model => model.init(this.connection))
      // Loader de models
      .map(model => model.associate && model.associate(this.connection.models))
  }

  mongo () {
    this.mongoConnection = mongoose.connect(
      'mongodb://localhost:27017/gobarber',
      {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true
      }
    )
  }
}

export default new Database()
