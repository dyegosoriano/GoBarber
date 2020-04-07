import Appointment from '../models/Appointments'
import User from '../models/User'
import * as Yup from 'yup'

class AppointmentController {
  async store (request, response) {
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
    console.log('Cheguei')

    const appointment = await Appointment.create({
      user_id: request.userId,
      provider_id,
      date
    })

    return response.json(appointment)
  }
}

export default new AppointmentController()
