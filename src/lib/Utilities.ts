import { QueryBuilder } from 'typeorm'

export class Utilities {

  times: { time: number, message: string }[] = []

  beginTimeLog(): void {
    this.times = []
  }

  logTime(message: string): void {
    this.times.push({ message, time: Date.now() })
  }

  endTimeLog(message?: string): void {
    if (message) {
      console.log(message)
    }
    for (let t = 0; t < this.times.length - 1; t++) {
      console.log(`${(t + 1)}. ${this.times[t].message}`)
      console.log(`---- ${(this.times[(t + 1)].time - this.times[t].time)}`)
    }
    console.log(`TOTAL TIME: ${(this.times[this.times.length - 1].time - this.times[0].time)}`)
  }

  public static validateEmail(value: string): boolean {
    // eslint-disable-next-line
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(value).toLowerCase())
  }

  public static randomString(size: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    let randomString = ''
    for (let x = 0; x < size; x++) {
      const charIndex = Math.floor(Math.random() * characters.length)
      randomString += characters.substring(charIndex, charIndex + 1)
    }
    return randomString
  }

  public static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  public static randomColor(): string {
    let hex = Math.floor(Math.random() * 16777215).toString(16)
    if (hex.length < 6) {
      hex += '0'
    }
    return `#${hex}`
  }

  public static wait(duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), duration)
    })
  }

  public static async rawQuery(query: QueryBuilder<any>): Promise<string> {
    const [queryString, params] = query.getQueryAndParameters()
    let debugString = queryString
    for (let p = params.length - 1; p >= 0; p--) {
      let param = params[p]
      if (typeof param === 'string') {
        param = `'${param}'`
      }
      while (debugString.indexOf(`$${(p + 1)}`) !== -1) {
        debugString = debugString.replace(`$${(p + 1)}`, param)
      }

    }
    console.log(debugString)
    return ''
  }

  public static async rawSql(queryString: string, params: any[]): Promise<string> {
    let debugString = queryString
    for (let p = params.length - 1; p >= 0; p--) {
      let param = params[p]
      if (typeof param === 'string') {
        param = `'${param}'`
      }
      while (debugString.indexOf(`$${(p + 1)}`) !== -1) {
        debugString = debugString.replace(`$${(p + 1)}`, param)
      }

    }
    console.log(debugString)
    return ''
  }

  public static getArrayDiff<T>(oldValues: T[], newValues: T[]): { add: T[], remove: T[], update: T[] } {
    const add: T[] = []
    const remove: T[] = []
    const update: T[] = []

    oldValues.forEach((val) => {
      if (newValues.includes(val)) {
        update.push(val)
      } else {
        remove.push(val)
      }
    })

    newValues.forEach((val) => {
      if (!oldValues.includes(val)) {
        add.push(val)
      }
    })

    return {
      add,
      remove,
      update,
    }
  }

  static diffArrays<T>(oldValues: T[], newValues: T[]): { add: T[], remove: T[], update: T[] } {

    // TODO: Update to allow for multiple instances of the same value
    const add: T[] = []
    const remove: T[] = []
    const update: T[] = []

    oldValues.forEach((val) => {
      if (newValues.includes(val)) {
        update.push(val)
      } else {
        remove.push(val)
      }
    })

    newValues.forEach((val) => {
      if (!oldValues.includes(val)) {
        add.push(val)
      }
    })

    return {
      add,
      remove,
      update,
    }
  }

}
