import Notification from '../schemas/Notification'
import User from '../models/User'

class NotificationController {
  async index (request, response) {
    // Listagem de Notificações
    const isProvider = await User.findOne({
      where: { id: request.userId, provider: true }
    })

    if (!isProvider) {
      return response.status(401).json({ error: 'Only providers can load notifications' })
    }

    const notifications = await Notification.find({
      user: request.userId
    })
      .sort({ createdAt: 'desc' })
      .limit(20)

    return response.json(notifications)
  }

  async update (request, response) {
    // Atualizando notificação
    const notification = await Notification.findByIdAndUpdate(
      request.params.id,
      { read: true },
      { new: true }
    )

    return response.json(notification)
  }
}

export default new NotificationController()
