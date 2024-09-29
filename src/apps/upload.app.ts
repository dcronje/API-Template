import express from 'express'
import { GraphQLError } from 'graphql'
import multer from 'multer'

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    console.log(file)
    callBack(null, 'uploads')
  },
})
let upload = multer({ storage })
export const uplaodApp = express();
uplaodApp.post('/uploads', upload.single('file'), (req, res, next) => {
  const file = req.file;

  if (!file) {
    const error = new GraphQLError('No File', { extensions: { code: 400 } })
    return next(error)
  }
  console.log(file.filename);
  res.send(file);
})
