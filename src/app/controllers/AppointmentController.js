import * as Yup from 'yup'
import { startOfHour, parseISO, isBefore, format } from 'date-fns'
import pt from 'date-fns/locale/pt'

import Appointment from '../models/Appointments'
import User from '../models/User'
import File from '../models/File'
import Notification from '../schemas/Notification'

class AppointmentController {
  async store (request, response) {
    // Validando campos de entrada com Yup
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    })

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails' })
    }

    const { provider_id, date } = request.body
    // Verificando se o provider_id e de um provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true }
    })

    if (!isProvider) {
      return response.status(401).json({ error: 'You can only appointments with providers' })
    }

    // Verificando se a data de agendamento não é antiga
    const hourStart = startOfHour(parseISO(date))
    if (isBefore(hourStart, new Date())) {
      return response.status(400).json({ error: 'Past dates are not permitted' })
    }

    // Verificando se existe hoário disponível
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    })

    if (checkAvailability) {
      return response.status(401).json({ error: 'Appointment date is not available' })
    }

    const appointment = await Appointment.create({
      user_id: request.userId,
      provider_id,
      date: hourStart
    })

    // Notificando prestador de serviço
    const user = await User.findByPk(request.userId)
    const formatteDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    )

    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formatteDate}`,
      user: provider_id
    })

    return response.json(appointment)
  }

  async index (request, response) {
    // Buscando página
    const { page = 1 } = request.query

    // Listagem de agendamentos
    const appointments = await Appointment.findAll({
      where: {
        user_id: request.userId,
        canceled_at: null
      },
      // Ordenando os agendamentos por datas
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20, // Limitando numero de agendamentos visiveis
      offset: (page - 1) * 20, // Limitando numero de agendamentos visiveis
      include: [
        {
          // Incluindo os dados de usuário provider
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url', 'path']
            }
          ]
        }
      ]
    })

    return response.json(appointments)
  }
}

export default new AppointmentController()
