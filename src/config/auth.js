// Configurações de autenticação JWT
export default {
  secret: process.env.APP_SECRET,
  expiresIn: '7d'
}
