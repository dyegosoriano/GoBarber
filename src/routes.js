import { Router } from 'express'
import User from './app/models/Users'

const routes = new Router()

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Dyego Soriano',
    email: 'dyegodf2@gmail.com',
    password_hash: '123456'
  })

  return res.json(user)
})

export default routes
