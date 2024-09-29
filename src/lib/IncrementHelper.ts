import { AppDataSource } from '@root/data-source'
import { Increment } from '@models/index'

class IncrementHelper {

  static incrementer: IncrementHelper | null = null
  inUse = false

  static shared() {
    if (!this.incrementer) {
      this.incrementer = new IncrementHelper()
    }
    return this.incrementer
  }

  async next(key: string, length = 6): Promise<string> {
    while (this.inUse) {
      await this.sleep(80)
    }
    this.inUse = true
    try {
      let increment = await AppDataSource.getRepository(Increment).createQueryBuilder()
        .where('"key" = :key', { key })
        .getOne()
      if (!increment) {
        const qry = AppDataSource.getRepository(Increment).createQueryBuilder()
        await qry.insert().values({ key }).execute()
        increment = await AppDataSource.getRepository(Increment).createQueryBuilder()
          .where('"key" = :key', { key })
          .getOne()
      }
      let value = increment!.value
      value++
      await AppDataSource.getRepository(Increment).createQueryBuilder()
        .update()
        .set({ value })
        .where('"key" = :key', { key })
        .execute()
      const stringValue = `${value}`
      return stringValue.padStart(length, '0')
    } finally {
      this.inUse = false
    }
  }

  private async sleep(millis: number) {
    return new Promise(resolve => setTimeout(resolve, millis))
  }

}

export default IncrementHelper
