import Bee from 'bee-queue'
import CancellationMail from '../app/jobs/CancellationMail'
import configRedis from '../config/redis'

const jobs = [CancellationMail]

class Queue {
  constructor () {
    this.queues = {}

    this.init()
  }

  // Inicializando fila
  init () {
    jobs.map(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: configRedis
        }),
        handle
      }
    })
  }

  // Adicionando novos itens a fila
  add (queue, job) {
    return this.queues[queue].bee.createJob(job).save()
  }

  // Processando as filas
  processQueue () {
    jobs.forEach((job) => {
      const { bee, handle } = this.queues[job.key]

      bee.process(handle)
    })
  }
}

export default new Queue()
