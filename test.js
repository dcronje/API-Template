
const fs = require('fs')
const path = require('path')

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const begin = async () => {
  const filePath = path.join(__dirname, './src/types/generated.ts')
  let data = await readFile(filePath)
  let newEnums = ``
  // console.log(data)
  let match = data.match(/export const enum (.*?) \{(.*?)\}/s)
  while (match) {
    const newEnum = `export enum ${match[1]} {${match[2].split('\n').map((line) => `  ${line.trim()}`).join('\n')}\n}`
    console.log(newEnum)
    newEnums += newEnum + '\n\n'
    data = data.replace(/export const enum (.*?) \{(.*?)\}/s, '')
    match = data.match(/export const enum (.*?) \{(.*?)\}/s)
  }
  console.log(newEnums)
}

begin()