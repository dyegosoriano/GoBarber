import jwt from 'jsonwebtoken'
import * as Yup from 'yup'

import authConfig from '../../config/auth'
import User from '../models/User'

class SessionController {
  async store (req, res) {
    // Validando campos de entrada com Yup
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required()
    })

    if (!(await schema.isValid(req.body))) res.status(400).json({ error: 'Validation fails' })

    // Buscando dados da requisição
    const { email, password } = req.body

    // Vefiricando a existência do email no banco de dados
    const user = await User.findOne({ where: { email } })
    if (!user) res.status(401).json({ error: 'User not found' })

    // Verificando se a senha é a mesma cadastrada no banco de dados
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' })
    }

    // Retornando dados via token JWT
    const { id, name } = user

    return res.json({
      user: {
        id,
        name,
        email
      },
      // Exportando token usando JWT
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn
      })
    })
  }
}

export default new SessionController()
