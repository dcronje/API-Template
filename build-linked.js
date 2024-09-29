const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const linked = require('./linked')

function execute(command) {
  console.log(command)
  return new Promise((resolve, reject) => {
    exec(command, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

console.log(linked)

async function go() {
  for (let l = 0; l < linked.length; l++) {
    let cmd = `cd ${linked[l].root} && npm run build`
    await execute(cmd)
    cmd = `cp -R ${linked[l].build} ${linked[l].dest.replace('/build', '')}`
    await execute(cmd)
  }
}

go()