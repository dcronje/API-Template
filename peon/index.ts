import 'reflect-metadata'
import path from 'path'
import minimist from 'minimist'
import Peon from './Peon'

const run = async () => {
  const peon = new Peon(path.join(__dirname, '../schema/'))
  await peon.begin()
}

const generateAll = async () => {
  const peon = new Peon(path.join(__dirname, '../schema/'))
  await peon.generateAll()
  // process.exit()
}

// const generateOr = process.argv.includes('--generate')
if (process.argv.length >= 3) {
  const args = minimist(process.argv.slice(2))
  // lets generate again
  if (args.generate) {
    generateAll()
  }
} else {
  run()
}
