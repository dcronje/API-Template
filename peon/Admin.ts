import JWTAuth from '@lib/JWTAuth'
import { createConnection } from 'typeorm'
import inquirer from 'inquirer'

enum Steps {
  Details = 'Details',
}

class Admin {

  async begin(): Promise<void> {
    let { firstName, lastName, email, password } = await this.getMenuOptionsForStep(Steps.Details)
    const auth = new JWTAuth()
    password = await auth.generatePasswordHash(password)
    const connection = await createConnection()
    const qry = 'INSERT INTO "user" ("firstName", "lastName", "email", "password", "super", "admin", "status", "type") VALUES ($1, $2, $3, $4, TRUE, TRUE, \'ACTIVE\', \'RegisteredUser\')'
    await connection.query(qry, [firstName, lastName, email, password])
    connection.close()

  }

  async getMenuOptionsForStep(step: Steps): Promise<any> {
    let menuItems: inquirer.Questions = []
    switch (step) {
      case Steps.Details:
        menuItems = [{
          type: 'input',
          name: 'firstName',
          message: 'Please enter the users First Name',
        }, {
          type: 'input',
          name: 'lastName',
          message: 'Please enter the users Last Name',
        }, {
          type: 'input',
          name: 'email',
          message: 'Please enter the users Email Address',
        }, {
          type: 'password',
          name: 'password',
          message: 'Please enter the users Password',
        }]
        break
      default:
        break
    }
    return inquirer.prompt(menuItems)
  }

  async getRootMenuOption() {
    const questions = [{
      type: 'list',
      name: 'ACTION',
      message: 'What kind of object would you like to add?',
      choices: [
        'Interface',
        'Model',
      ],
    }]
    return inquirer.prompt(questions)
  }

}

export default Admin
