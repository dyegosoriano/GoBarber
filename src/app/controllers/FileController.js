import File from '../models/File'

class FileController {
  // Salvando imagem no banco de dados
  async store (request, response) {
    const { originalname: name, filename: path } = request.file
    const file = await File.create({
      name,
      path
    })

    return response.json(file)
  }

  async update (request, response) {
    // Alterar usuário
    return response.json()
  }

  async index (request, response) {
    // Listagem de usuários
    return response.json()
  }

  async show (request, response) {
    // Exibir um único usuário
    return response.json()
  }

  async delete (request, response) {
    // Remover usuário
    return response.json()
  }
}

export default new FileController()
