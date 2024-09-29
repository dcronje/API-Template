import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import moment from 'moment'
class JWTData {

  'type': string
  'id': string

}
class JWT {

  'iat': number
  'jti': string
  'iss' = 'wms'
  'aud' = 'api-users'
  'exp'?: number
  'typ' = '/online/transactionstatus/v2'
  'data': JWTData

}

class JWTAuth {

  constructor() {
    if (!process.env.JWT_KEY) {
      throw new Error('Please set a JWT_KEY field in your .env file')
    }
  }

  getToken(header: string): string | null {
    const matches = header.match(/^Bearer\s(.*)$/)
    let token = matches?.[1] ?? null
    if (token === 'null') {
      token = null
    }
    return token
  }

  createWithoutExpiration(type = 'api', id = 'unknown'): string {

    const timestamp = Math.floor(Date.now() / 1000)
    const key = Buffer.from(this.randomString(40)).toString('base64')

    const payload: JWT = {
      iat: timestamp,
      jti: key,
      iss: 'wms',
      aud: 'api-users',
      typ: '/online/transactionstatus/v2',
      data: {
        type,
        id,
      },
    }
    const secret: string = process.env.JWT_KEY as string
    // encode
    return jwt.sign(payload, secret)
  }

  create(expiryInterval = 24, type = 'api', id = 'unknown'): string {

    const expiryDate = new Date()
    expiryDate.setHours(expiryDate.getHours() + expiryInterval)
    const timestamp = Math.floor(Date.now() / 1000)
    const key = Buffer.from(this.randomString(40)).toString('base64')
    const expiry = Math.floor(expiryDate.getTime() / 1000)

    const payload: JWT = {
      iat: timestamp,
      jti: key,
      iss: 'wms',
      aud: 'api-users',
      exp: expiry,
      typ: '/online/transactionstatus/v2',
      data: {
        type,
        id,
      },
    }
    const secret: string = process.env.JWT_KEY as string
    // encode
    return jwt.sign(payload, secret)
  }

  createWithExpiryDate(expiryDate: Date, type = 'api', id = 'unknown'): string {
    const now = moment()
    const expires = moment(expiryDate)
    const secondsDiff = moment.duration(expires.diff(now)).asSeconds()

    const timestamp = Math.floor(Date.now() / 1000)
    const key = Buffer.from(this.randomString(40)).toString('base64')
    const expirationDate = now.add(secondsDiff, 's')
    const expiry = expirationDate.unix()

    const payload: JWT = {
      iat: timestamp,
      jti: key,
      iss: 'wms',
      aud: 'api-users',
      exp: expiry,
      typ: '/online/transactionstatus/v2',
      data: {
        type,
        id,
      },
    }
    const secret: string = process.env.JWT_KEY as string
    return jwt.sign(payload, secret)
  }

  validate(token: string) {
    const timestamp = Math.floor(Date.now() / 1000)
    const data = this.decode(token) as JWT

    if (data.exp && data.exp < timestamp) {
      throw new Error(JSON.stringify({
        message: 'Invalid Request Token',
        code: 403,
      }))
    } else {
      return data.data
    }
  }

  decode(token: string): JWT {
    const secret: string = process.env.JWT_KEY as string

    try {
      return jwt.verify(token, secret) as JWT
    } catch (err) {
      console.log(err)
      throw new Error('Oh no! This payment link has expired for your security. Billing for this week\'s orders may have closed – please contact Customer Support on support@wms.co.za or on 021 447 4424 for more information.')
    }
  }

  randomString(size: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    let randomString = ''
    for (let x = 0; x < size; x++) {
      const charIndex = Math.floor(Math.random() * characters.length)
      randomString += characters.substring(charIndex, charIndex + 1)
    }
    return randomString
  }

  async generatePasswordHash(password: string): Promise<string> {
    // @NOTE: postgres::pgcrypto understand 8 rounds, not 10 sadly
    const salt = bcrypt.genSaltSync(8)
    return bcrypt.hash(password, salt)
  }

  async comparePasswordHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

}

export default JWTAuth
