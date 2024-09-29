import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BaseEntity, Unique, Index } from 'typeorm'
import { Device, User } from '@models/index'

@Entity()
@Unique('user_device_unique', ['user', 'device'])
export class UserDevice extends BaseEntity {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'boolean', default: false })
  active = false

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date()

  @Index()
  @Column()
  userId!: string

  @ManyToOne(type => User, user => user.userDevices, { lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Promise<User> | User

  @Index()
  @Column()
  deviceId!: string

  @ManyToOne(type => Device, device => device.userDevices, { lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device!: Promise<Device> | Device

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date()

  async getPublicUser(): Promise<any> {
    return {}
  }

}
