import JWTAuth from '@lib/JWTAuth'
import { sendEmail } from '@queues/TransactionalEmailQueue' // re-instate// move to ORM
import { DeepPartial } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { Saga } from '@lib/Saga'
import { SagaController } from '@lib/SagaController'
import { createHash } from 'crypto'
import { GraphQLError } from 'graphql'
import { AppDataSource } from '@root/data-source'
import { TitleEnum } from '@root/types/generated'
import { User, UserDevice } from '@models/index'

interface DeleteArgs {
  user: User
  ctx: GQLContext
}

type DeleteContext = DeleteArgs

interface AddArgs {
  title?: TitleEnum
  firstName: string
  lastName: string
  email?: string
  ctx: GQLContext
}

interface AddContext extends AddArgs {
  user?: User
}

interface UpdateArgs {
  user: User
  title?: TitleEnum
  firstName?: string
  lastName?: string
  email?: string
  ctx: GQLContext
}

type UpdateContext = UpdateArgs

interface ValidateInviteArgs {
  token: string
  ctx: GQLContext
}

interface ValidateInviteContext extends ValidateInviteArgs {
  user?: User
}

interface LogInArgs {
  email: string
  password: string
  ctx: GQLContext
}

interface LogInContext extends LogInArgs {
  user?: User
}

interface LogOutArgs {
  ctx: GQLContext
}

type LogOutContext = LogOutArgs

interface SignUpArgs {
  title?: string
  firstName: string
  lastName: string
  email: string
  password: string
  ctx: GQLContext
}

interface SignUpContext extends SignUpArgs {
  user?: User
}

interface RequestPasswordResetArgs {
  email: string
  ctx: GQLContext
}

interface RequestPasswordResetContext extends RequestPasswordResetArgs {
  user?: User
  link?: string
}

interface ResetPasswordArgs {
  token: string
  password: string
  ctx: GQLContext
}

interface ResetPasswordContext extends ResetPasswordArgs {
  user?: User
}

interface SendInvitationArgs {
  user: User
  ctx: GQLContext
}

type SendInvitationContext = SendInvitationArgs

export class UserSaga extends SagaController {

  async delete(args: DeleteArgs): Promise<User> {

    const context = {
      ...args,
    }
    return new Saga<DeleteContext, User>(context, this.locked)
      .commit(async (context) => {
        const { user } = context
        const updateUserData = {} as QueryDeepPartialEntity<User>
        if (user) {
          updateUserData.firstName = 'deleted'
          updateUserData.lastName = 'deleted'
          updateUserData.email = createHash('sha256').update(user.email).digest('hex') + '@deleted.sih'
        }
        await AppDataSource.getRepository(User).createQueryBuilder()
          .update()
          .set(updateUserData)
          .where('"id" = :id', { id: user.id })
          .execute()
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        return context.user
      })
      .execute()
  }

  async add(args: AddArgs): Promise<User> {
    const context = {
      ...args,
    }
    return new Saga<AddContext, User>(context, this.locked)
      .validate(async (context) => {
        const { email } = context
        const unique = User.hasUniqueCredentials({ email })
        if (!unique) {
          throw new GraphQLError('This email adress already exists.', { extensions: { code: 400 } })
        }
        return context
      })
      .commit(async (context) => {
        const { firstName, lastName, email } = context
        const userAddData: DeepPartial<User> = {
          firstName,
          lastName,
          email,
        }
        const user = User.create<User>(userAddData)
        await user.save()
        return { ...context, user }
      })
      .commit(async (context) => {
        const { user } = context
        await user?.setDefaultRoles()
        return context
      })
      .commit(async (context) => {
        const { user } = context
        if (user) {
          sendEmail({
            from: 'admin@warehouses.sih.services',
            to: user.email,
            sender: 'Silvertree Warehouse Admin',
            subject: 'Silvertree Warehouse Admin SignUp',
            html: `
          <body>
            <h1>Hi ${user.firstName}</h1>
            <div>You have been invited to use the Silvertree Warehouse Admin System</div>
            <div>Click <a href="${process.env.ADMIN_BASE_URL}/login">This Link</a> to get started</div>
          </body>
        `,
          })
        }
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        if (!context.user) {
          throw new GraphQLError('Could not resolve user', { extensions: { code: 500 } })
        }
        return context.user
      })
      .execute()
  }

  async update(args: UpdateArgs): Promise<User> {
    const context = {
      ...args,
    }
    return new Saga<UpdateContext, User>(context, this.locked)
      .commit(async (context) => {
        const { user, title, firstName, lastName, email } = context
        const updateData = {} as QueryDeepPartialEntity<User>
        if (title) {
          updateData.title = title
        }
        if (firstName) {
          updateData.firstName = firstName
        }
        if (lastName) {
          updateData.lastName = lastName
        }
        if (email) {
          updateData.email = email
        }
        await AppDataSource.getRepository(User).createQueryBuilder()
          .update()
          .set(updateData)
          .where('"id" = :id', { id: user.id })
          .execute()
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        return context.user
      })
      .execute()
  }

  async validateInvite(args: ValidateInviteArgs): Promise<User> {
    const context = {
      ...args,
    }
    return new Saga<ValidateInviteContext, User>(context, this.locked)
      .validate(async (context) => {
        const { token } = context
        const jwt = new JWTAuth()
        const userInfo = jwt.validate(token)
        const user = await AppDataSource.getRepository(User).createQueryBuilder()
          .where('"id" = :id', { id: userInfo.id })
          .getOne()
        if (!user) {
          throw new GraphQLError('User not found', { extensions: { code: 400 } })
        }
        if (user.hasAcceptedInvite || !user.invitationToken) {
          throw new GraphQLError('User already signed up', { extensions: { code: 400 } })
        }
        return { ...context, user }
      })
      .rollback(async () => {
        throw new GraphQLError('Your invitation is not valid or has expired', { extensions: { code: 403 } })
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        if (!context.user) {
          throw new GraphQLError('Could not resolve user', { extensions: { code: 500 } })
        }
        return context.user
      })
      .execute()
  }

  async login(args: LogInArgs): Promise<User> {
    const context = {
      ...args,
    }
    return new Saga<LogInContext, User>(context, this.locked)
      .validate(async (context) => {
        const { ctx: { device } } = context
        if (!device) {
          throw new GraphQLError('User not accessing system from known device!', { extensions: { code: 403 } })
        }
        return context
      })
      .validate(async (context) => {
        const { email } = context
        const user = await AppDataSource.getRepository(User).createQueryBuilder()
          .where('LOWER("email") = :email', { email: email.toLowerCase() })
          .getOne() || undefined
        return { ...context, user }
      })
      .validate(async (context) => {
        const { user, password } = context
        const isValidPassword = await user?.validatePassword(password) || false
        if (!isValidPassword) {
          throw new GraphQLError('You have entered an invalid email/password combination', { extensions: { code: 400 } })
        }
        return context
      })
      .commit(async (context) => {
        const { user, ctx: { device } } = context
        if (user && device) {
          await user.setActiveDevice({ device })
        }
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        if (!context.user) {
          throw new GraphQLError('Could not resolve user', { extensions: { code: 500 } })
        }
        return context.user
      })
      .execute()
  }

  async logOut(args: LogOutArgs): Promise<void> {
    const context = {
      ...args,
    }
    return new Saga<LogOutContext, void>(context, this.locked)
      .validate(async (context) => {
        const { ctx: { device } } = context
        if (!device) {
          throw new GraphQLError('User not accessing system from known device!', { extensions: { code: 500 } })
        }
        return context
      })
      .validate(async (context) => {
        const { ctx: { user } } = context
        if (!user) {
          throw new GraphQLError('Unknown user!', { extensions: { code: 500 } })
        }
        return context
      })
      .commit(async (context) => {
        const { ctx: { user, device } } = context
        if (user && device) {
          const userDeviceConnection = AppDataSource.getRepository(UserDevice)
          const userDevice = await userDeviceConnection.createQueryBuilder()
            .where('"userId" = :userId', { userId: user.id })
            .andWhere('"deviceId" = :deviceId', { deviceId: device.id })
            .getOne()
          if (userDevice) {
            await userDeviceConnection.createQueryBuilder()
              .update()
              .set({ active: false })
              .where('"id" = :id', { id: userDevice.id })
              .execute()
          }
          context.ctx.user = null
          context.ctx.userId = null
        } else {
          throw new GraphQLError('Cant log out no user', { extensions: { code: 500 } })
        }
        return context
      })
      .rollback((e) => {
        throw e
      })
      .execute()
  }

  async signUp(args: SignUpArgs): Promise<User> {
    const context = {
      ...args,
    }
    return new Saga<SignUpContext, User>(context, this.locked)
      .validate(async (context) => {
        const { ctx: { device } } = context
        if (!device) {
          throw new GraphQLError('User not accessing system from known device!', { extensions: { code: 500 } })
        }
        return context
      })
      .commit(async (context) => {
        const { password, firstName, lastName, email } = context
        const hashedPassword = await new JWTAuth().generatePasswordHash(password)

        const user = User.create({
          password: hashedPassword,
          hasAcceptedInvite: true,
          invitationToken: null,
          firstName,
          lastName,
          email,
        } as DeepPartial<User>)
        await user.save()
        return { ...context, user }
      })
      .commit(async (context) => {
        const { user } = context
        await user?.setDefaultRoles()
        return context
      })
      .commit(async (context) => {
        const { user, ctx: { device } } = context
        if (user && device) {
          await user.setActiveDevice({ device })
        }
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async (context) => {
        if (!context.user) {
          throw new GraphQLError('Could not resolve user', { extensions: { code: 500 } })
        }
        return context.user
      })
      .execute()
  }

  async requestPasswordReset(args: RequestPasswordResetArgs): Promise<boolean> {
    const context = {
      ...args,
    }
    return new Saga<RequestPasswordResetContext, boolean>(context, this.locked)
      .validate(async (context) => {
        const { email } = context
        const user = await AppDataSource.getRepository(User).createQueryBuilder()
          .where('LOWER("email") LIKE :email', { email: email.toLowerCase() })
          .getOne()
        if (!user) {
          throw new GraphQLError('The email address you have entered does not exist.', { extensions: { code: 400 } })
        }
        return { ...context, user }
      })
      .commit(async (context) => {
        const { user } = context
        if (user) {
          const jwt = new JWTAuth()
          const token = await jwt.create(2, 'RESET', user.id)
          await AppDataSource.getRepository(User).createQueryBuilder()
            .update()
            .set({ passwordResetToken: token })
            .where('"id" = :id', { id: user.id })
            .execute()
          await user.reload()
        }
        return context
      })
      .commit(async (context) => {
        const { user } = context
        let link = ''
        if (user) {
          link = process.env.ADMIN_BASE_URL + '/reset/' + user.passwordResetToken
          sendEmail({
            from: 'admin@wms.co.za',
            to: user.email,
            sender: 'WMS Admin',
            subject: 'WMS Admin Password Reset',
            html: `
                <body>
                  <h1>Hi ${user.firstName}</h1>
                  <div>A password reset request was made for your email address</div>
                  <div>Click <a href="${link}">This Link</a> to reset your password</div>
                </body>
              `,
          })
        }
        return { ...context, link }
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async () => {
        return true
      })
      .execute()
  }

  async resetPassword(args: ResetPasswordArgs): Promise<boolean> {
    const context = {
      ...args,
    }
    return new Saga<ResetPasswordContext, boolean>(context, this.locked)
      .commit(async (context) => {
        const { token } = context
        const jwt = new JWTAuth()
        const userInfo = jwt.validate(token)
        const user = await AppDataSource.getRepository(User).createQueryBuilder()
          .where('"id" = :id', { id: userInfo.id })
          .getOne()
        if (!user || !user.passwordResetToken) {
          throw new GraphQLError('User not found', { extensions: { code: 400 } })
        }
        return { ...context, user }
      })
      .commit(async (context) => {
        const { user, password } = context
        if (user) {
          const token = await new JWTAuth().generatePasswordHash(password)
          await AppDataSource.getRepository(User).createQueryBuilder()
            .update()
            .set({
              password: token,
              passwordResetToken: null,
            })
            .where('"id" = :id', { id: user.id })
            .execute()
        }
        return context
      })
      .rollback(async () => {
        throw new GraphQLError('Your reset token is not valid or has expired', { extensions: { code: 403 } })
      })
      .aggregate(async () => {
        return true
      })
      .execute()
  }

  async sendInvitation(args: SendInvitationArgs): Promise<boolean> {
    const context = {
      ...args,
    }
    return new Saga<SendInvitationContext, boolean>(context, this.locked)
      .validate(async (context) => {
        const { user } = context
        if (user.hasAcceptedInvite) {
          throw new GraphQLError(`${user.firstName} ${user.lastName} has already signed up`, { extensions: { code: 400 } })
        }
        return context
      })
      .commit(async (context) => {
        const { user } = context
        const jwt = new JWTAuth()
        const token = jwt.create(24, 'INVITE', user.id)
        await AppDataSource.getRepository(User).createQueryBuilder()
          .update()
          .set({ invitationToken: token })
          .where('"id" = :id', { id: user.id })
          .execute()
        return context
      })
      .commit(async (context) => {
        const { user } = context
        sendEmail({
          from: 'admin@wms.co.za',
          to: user.email,
          sender: 'WMS Admin',
          subject: 'WMS Admin SignUp',
          html: `
            <body>
              <h1>Hi ${user.firstName}</h1>
              <div>You have been invited to use the WMS Admin System</div>
              <div>Click <a href="${process.env.ADMIN_BASE_URL}/signup/${user.invitationToken}">This Link</a> to get started</div>
            </body>
          `,
        })
        return context
      })
      .rollback((e) => {
        throw e
      })
      .aggregate(async () => {
        return true
      })
      .execute()
  }

}
