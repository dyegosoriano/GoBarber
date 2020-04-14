import * as Yup from 'yup'
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns'
import pt from 'date-fns/locale/pt'

import Appointment from '../models/Appointment'
import Notification from '../schemas/Notification'
import User from '../models/User'
import File from '../models/File'

import Mail from '../../lib/Mail'

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

    // Verificando se o usuário esta tentando marcar um horário com ele mesmo
    if (request.userId === provider_id) {
      return response.status(400).json({ error: 'The user cannot make an appointment with himself' })
    }

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

  async delete (request, response) {
    const appointment = await Appointment.findByPk(request.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email']
        }
      ]
    })

    // Validando se o usuário tem mesmo permissão para deletar o agendamento
    if (appointment.user_id !== request.userId) {
      return response.status(401).json({ error: "You don't have permission to cancel this appointment" })
    }

    // Regra que impossibilita o cancelamento do agendamento com limite de 2h antes
    const dateWithSub = subHours(appointment.date, 2)

    if (isBefore(dateWithSub, new Date())) {
      return response.status(401).json({ error: 'You can only cancel appointments 2 hours in advance.' })
    }

    // Adicionando data e horario de cancelamento
    appointment.canceled_at = new Date()
    await appointment.save()

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}`,
      subject: 'Agendamento cancelado',
      text: 'Você tem um novo cancelamento'
    })

    return response.json(appointment)
  }
}

export default new AppointmentController()
