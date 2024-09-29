import JWTAuth from '@lib/JWTAuth'
import { UserSaga } from '@root/sagas/UserSaga'
import { Mutex, MutexInterface } from 'async-mutex'
import { DataSource } from 'typeorm'
import { AppDataSource } from './data-source'
import { Device, UserDevice, User } from '@models/index'

const locks: Map<string, MutexInterface> = new Map()

const getDevice = async (dbConnection: DataSource, token: string): Promise<Device | null> => {
  let device: Device | null = null
  if (token) {
    try {
      const tempDevice = await dbConnection.getRepository(Device).createQueryBuilder()
        .where('"id" = :id', { id: token })
        .getOne()

      if (tempDevice) {
        await dbConnection.getRepository(Device).createQueryBuilder()
          .update()
          .set({ updatedAt: new Date() })
          .where('"id" = :id', { id: tempDevice.id })
          .execute()
        device = tempDevice
      }
    } catch (e) {
      // console.log('Token not valid')
    }

  }
  return device
}

const getUser = async (dbConnection: DataSource, device: Device | null): Promise<User | null> => {
  let user: User | null = null

  if (device) {
    const userDevice = await dbConnection.getRepository(UserDevice).createQueryBuilder()
      .where('"active" = TRUE')
      .andWhere('"deviceId" = :deviceId', { deviceId: device.id })
      .getOne()

    if (userDevice) {
      const currentUser = await userDevice.user
      if (currentUser) {
        user = currentUser
        await dbConnection.getRepository(Device).createQueryBuilder()
          .update()
          .set({ updatedAt: new Date() })
          .where('"id" = :id', { id: userDevice.id })
          .execute()
      } else {
        await userDevice.remove()
      }
    }
  }

  return user
}

const getUserID = async (dbConnection: DataSource, device: Device | null): Promise<string | null> => {
  let userId: string | null = null

  if (device) {
    const userIds = await dbConnection.query('SELECT "userId" FROM "user_device" WHERE "deviceId" = $1 AND active = TRUE', [device.id])
    if (userIds.length) {
      userId = userIds[0].userId
    }
  }

  return userId
}

const getUserInfo = async (token: string): Promise<{ user: User | null, device: Device | null, userId: string | null }> => {
  return new Promise<{ user: User | null, device: Device | null, userId: string | null }>((resolve) => {
    if (!locks.has(token)) {
      locks.set(token, new Mutex())
    }
    const lock = locks.get(token) as MutexInterface
    lock.runExclusive(async () => {
      const dbConnection = AppDataSource

      try {
        const device = await getDevice(dbConnection, token || '')
        const user = await getUser(dbConnection, device)
        const userId = await getUserID(dbConnection, device)
        return resolve({ device, user, userId })
      } catch (e) {
        return resolve({ device: null, user: null, userId: null })
      }
    })
  })
}

export const context = async (authKey?: string): Promise<GQLContext> => {

  const auth = new JWTAuth()

  let token = '' as string | null
  let userInfo = {
    user: null as User | null,
    device: null as Device | null,
    userId: null as string | null,
  }

  try {
    token = auth.getToken(authKey || '') || ''
    userInfo = await getUserInfo(token)
  } catch (e: any) {
    console.log(e.message)
  }

  const { device, user, userId } = userInfo

  const ctxInfo: GQLContext = {
    user,
    device,
    userId,
    token,
  }

  return ctxInfo

}
