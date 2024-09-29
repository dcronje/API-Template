import express, { NextFunction, Request, Response } from 'express'

const corsApp = express()
corsApp.use((req: Request, res: Response, next: NextFunction) => {
  res.header({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': 86400,
    'Access-Control-Allow-Credentials': true,
  })
  if (req.method === 'OPTIONS') {
    res.end()
  } else {
    next()
  }
})

export { corsApp }
