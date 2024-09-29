import path from 'path'
import fs from 'fs'
import express, { Handler } from 'express'

let publicApp: Handler

if (fs.existsSync(path.join(__dirname, '../public'))) {
  publicApp = express.static(path.join(__dirname, '../public'), { maxAge: '1y' })
} else {
  publicApp = express.static(path.join(__dirname, '../../public'), { maxAge: '1y' })
}

export { publicApp }
