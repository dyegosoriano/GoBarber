import Sequelize, { Model } from 'sequelize'
import bcrypt from 'bcryptjs'

class User extends Model {
  static init (sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL, // Campo virtual
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN
      },
      {
        sequelize
      }
    )

    // Executando função do Sequelize que é executa antes de salvar os dados do usuário
    this.addHook('beforeSave', async user => {
      // Verificando existência de senha e criptografando
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8)
      }
    })

    return this
  }

  // Relacionando model User com model File
  static associate (models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id' })
  }

  // Método de verificação de senha
  checkPassword (password) {
    return bcrypt.compare(password, this.password_hash)
  }
}

export default User
