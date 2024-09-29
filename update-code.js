const fs = require('fs')
const path = require('path')

const getItemInfo = async (item) => {
  return new Promise((resolve, reject) => {
    fs.lstat(item, (err, result) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })
}

const getDirectoryInfo = async (directory) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path.resolve(directory), async (err, files) => {
      if (err) {
        return reject(err)
      }
      resolve(files)
    })
  })
}

const items = []

const importDir = async (dir, name = false) => {
  const fullDir = path.resolve(__dirname, dir)
  // console.log(fullDir)
  const files = await getDirectoryInfo(fullDir)
  for (const f in files) {
    const item = path.join(__dirname, dir, files[f])
    const stats = await getItemInfo(item)
    if (stats.isDirectory()) {
      await importDir(path.join(dir, files[f]), name)
    } else if (name) {
      if (files[f].includes(name)) {
        items.push(path.join(__dirname, dir, files[f]))
      }
    } else {
      items.push(path.join(__dirname, dir, files[f]))
    }
  }
}

const splitOrmImports = async () => {
  await importDir('./src', '.ts')
  for (let i = 0; i < items.length; i++) {
    let itemContent = fs.readFileSync(items[i], 'utf-8')
    if (itemContent.match(/@models\/index/)) {
      const models = []
      let importMatch = itemContent.match(/import {(.*?)} from '@models\/index'/)
      while (importMatch) {
        const items = importMatch[1].split(',')
          .map((item) => item.trim())
          .forEach((item) => {
            if (!models.includes(item)) {
              models.push(item)
            }
          })
        itemContent = itemContent.replace(`${importMatch[0]}\n`, '')
        importMatch = itemContent.match(/import {(.*?)} from '@models\/index'/)
      }
      const lines = itemContent.split('\n')
      const modelImports = models
        .filter((item) => item)
        .map((item) => {
          return `import { ${item} } from '@models/${item}'`
        })

      let lastImportIndex = 0
      for (let l = lines.length - 1; l >= 0; l--) {
        if (lines[l].match(/import (.*?) from (.*?)/)) {
          lastImportIndex = l + 1
          break
        }
      }

      modelImports.forEach((importItem, index) => {
        lines.splice((lastImportIndex) + index, 0, importItem)
      })
      const newContent = lines.join('\n')
      // itemContent = models.map((item) => {
      //   return `import { ${item} } from '@models/${item}'`
      // })
      // .join('\n') +'\n'+ itemContent
      if (lastImportIndex > 0) {
        console.log(newContent)
        fs.writeFileSync(items[i], newContent)
      }
    }
  }
}

const joinOrmImports = async () => {
  await importDir('./src', '.ts')
  for (let i = 0; i < items.length; i++) {
    let itemContent = fs.readFileSync(items[i], 'utf-8')
    if (itemContent.match(/@models/)) {
      if (items[i].indexOf('src/tests') !== -1) {
        continue
      }
      console.log(items[i])
      const models = []
      let modelMatch = itemContent.match(/import {(.*?)} from '@models\/(.*?)'/)
      while (modelMatch) {
        models.push(modelMatch[2])
        itemContent = itemContent.replace(`${modelMatch[0]}\n`, '')
        modelMatch = itemContent.match(/import {(.*?)} from '@models\/(.*?)'/)
      }
      const lines = itemContent.split('\n')
      const importItem = `import { ${models.join(', ')} } from '@models/index'`

      let lastImportIndex = 0
      for (let l = lines.length - 1; l >= 0; l--) {
        if (lines[l].match(/import (.*?) from (.*?)/)) {
          lastImportIndex = l + 1
          break
        }
      }

      lines.splice(lastImportIndex, 0, importItem)
      const newContent = lines.join('\n')
      console.log(newContent)
      fs.writeFileSync(items[i], newContent)
    }
  }
}

const go = async () => {
  await splitOrmImports()
  await joinOrmImports()
}

go()
