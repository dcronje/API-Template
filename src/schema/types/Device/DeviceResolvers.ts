import { GQLRegistry } from 'gql-registry'
import { PermissionRegistry } from '@lib/PermissionRegistry'
import DeviceResolversGenerated from '@generated/Device/DeviceResolversGenerated'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { GraphQLError } from 'graphql'
import { AppDataSource } from '@root/data-source'
import { MutationRegisterDeviceArgs, MutationValidateDeviceArgs } from '@root/types/generated'
import { Device } from '@models/index'

class DeviceResolvers extends DeviceResolversGenerated {

  constructor() {
    super()
    this.registerDevice = this.registerDevice.bind(this)
    this.validateDevice = this.validateDevice.bind(this)
  }

  register(registry: GQLRegistry, permissionRegistry: PermissionRegistry): void {
    const mutationResolvers = {
      registerDevice: this.registerDevice,
      validateDevice: this.validateDevice,
    }
    registry.registerType({
      mutationResolvers,
    })
  }

  async registerDevice(_: unknown | null, args: MutationRegisterDeviceArgs): Promise<{ id: string, isBot: boolean }> {

    const insertQry = AppDataSource.getRepository(Device).createQueryBuilder()
    const response = await insertQry.insert().values([args.input as QueryDeepPartialEntity<Device>]).execute()
    const insertedId = response.identifiers[0].id
    const getQry = AppDataSource.getRepository(Device).createQueryBuilder()
    const device = await getQry.where({ id: insertedId }).getOne()

    if (!device) {
      throw new GraphQLError('Cannot create device')
    }

    return {
      id: device.id,
      isBot: device.isBot,
    }
  }

  async validateDevice(_: unknown | null, args: MutationValidateDeviceArgs): Promise<{ id: string, isBot: boolean } | null> {

    try {
      const { token } = args

      const device = await AppDataSource.getRepository(Device).createQueryBuilder()
        .andWhere('"id" = :id', { id: token })
        .getOne()

      return device ? { id: device.id, isBot: device.isBot } : null
    } catch (e) {
      throw new GraphQLError('Token not valid')
    }
  }

}

export default DeviceResolvers
