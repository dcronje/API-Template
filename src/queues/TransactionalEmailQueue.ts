import QueueRegistry from '@lib/QueueRegistry'
import Bull, { Job } from 'bull'
import aws from 'aws-sdk'
import nodemailer, { SendMailOptions } from 'nodemailer'
import AWSHelper from '@lib/AWSHelper'
// @ts-ignore
import { htmlToText } from 'nodemailer-html-to-text'
import Mail from 'nodemailer/lib/mailer'

export interface SendEmail extends SendMailOptions {
  to: string
  delay?: number
}

class TransactionalEmailQueue {

  static async process(job: Job<SendEmail>): Promise<void> {
    await this.send(job)
  }

  static async send(job: Job<SendEmail>): Promise<void> {

    const { data } = job

    aws.config.update({
      region: AWSHelper.region(),
      credentials: AWSHelper.credentials(),
      apiVersion: AWSHelper.version(),
    }, false)

    const transporter = nodemailer.createTransport({ SES: new aws.SES() })
    // convert html to text
    transporter.use('compile', htmlToText())

    await job.progress(50)

    let testEmails: string[] = []

    if (process.env.TEST_EMAILS) {
      testEmails = process.env.TEST_EMAILS.split(',')
    }

    const sendMail = (options: Mail.Options): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        transporter.sendMail(options, (err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    }

    if (process.env.TEST_EMAILS !== undefined) {
      console.log('SIMULATING SEND')
      if (testEmails.length === 1 && testEmails[0]) {
        // Send all emails to one test address
        await sendMail({ ...data, to: testEmails[0] })
        await job.progress(100)

      } else if (testEmails.indexOf(data.to) !== -1) {
        // Send email to tester
        await sendMail(data)
        await job.progress(100)
      } else {
        // Do not send email
        console.log(`NOT SENDING EMAIL TO: ${data.to}`)
        await job.progress(100)
      }

    } else {
      // Normal sending without testing param
      await sendMail(data)
      await job.progress(100)
    }
  }

}

const queue = new Bull<SendEmail>('Email Queue', QueueRegistry.redisUrl())
const add = QueueRegistry.shared().registerProcessQueue<SendEmail>({
  queue,
  processes: 0,
  priority: 6,
  startProcess: (threads = 1): void => {
    queue.process(threads, (job): Promise<void> => {
      return TransactionalEmailQueue.process(job)
    })
  },
})

export const sendEmail = async (args: SendEmail): Promise<void> => {
  await add(args, (args.delay ? args.delay * 1000 * 60 : undefined))
}
