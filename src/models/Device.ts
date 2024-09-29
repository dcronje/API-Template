import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, BaseEntity, Index } from 'typeorm'
import { RegisteredDeviceTypeEnum } from '@root/enums'
import { UserDevice } from '@models/index'

@Entity()
export class Device extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', nullable: false, default: 'BROWSER' })
  type!: RegisteredDeviceTypeEnum

  @Column({ type: 'varchar' })
  userAgent!: string

  @Index()
  @Column({ type: 'boolean', default: false })
  isBot!: boolean

  @Column({ type: 'varchar', nullable: true })
  botName!: string | null

  @OneToMany(type => UserDevice, userDevice => userDevice.device, { lazy: true })
  userDevices!: Promise<Array<UserDevice>> | Array<UserDevice>

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

}
