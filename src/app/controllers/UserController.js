import * as Yup from 'yup'
import User from '../models/User'

class UserController {
  // Validando campos de entrada com Yup
  async store (req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6)
    })

    // Tratamento de erro de validação do Yup
    if (!(await schema.isValid(req.body))) return res.status(400).json({ error: 'Validation fails' })

    // Verificão de email no baco de dados
    const userExists = await User.findOne({ where: { email: req.body.email } })

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' })
    }

    // Salvando dados
    const { id, name, email, provider } = await User.create(req.body)

    return res.json({
      id,
      name,
      email,
      provider
    })
  }

  async update (req, res) {
    // Validando campos de entrada com Yup
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      )
    })

    // Tratamento de erro de validação do Yup
    if (!(await schema.isValid(req.body))) return res.status(400).json({ error: 'Validation fails' })

    const { email, oldPassword } = req.body

    // Buscando id no banco de dados atraves do userId inserido pelo Middleware de autenticação
    const user = await User.findByPk(req.userId)

    // Vefiricando a existência do email no banco de dados para atualização
    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } })

      // Tratamento de erro
      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' })
      }
    }

    // Verificando se a senha é a mesma cadastrada no banco de dados
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' })
    }

    // Atualizando e retornando os dados do usuário
    const { id, name, provider } = await user.update(req.body)

    return res.json({
      id,
      name,
      email,
      provider
    })
  }
}

export default new UserController()
