const gulp = require('gulp')
const { spawn, exec } = require('child_process')
const fse = require('fs-extra')

let api

const startServer = () => {
  return new Promise((resolve, reject) => {
    if (api) api.kill()
    const commands = ['ts-node', '--files', '-r', 'tsconfig-paths/register', '--transpile-only', 'src/server.ts', '--project', './tsconfig.json']
    console.log(`npx ${commands.join(' ')}`)
    api = spawn('npx', commands, { stdio: 'inherit' })
    api.on('close', function (code) {
      if (code === 8) {
        gulp.log('Error detected, waiting for changes...')
      }
    })
    resolve()
  })

}

const startCluster = () => {
  return new Promise((resolve, reject) => {
    if (api) api.kill()
    const commands = ['ts-node', '--files', '-r', 'tsconfig-paths/register', '--transpile-only', 'src/cluster.ts', '--project', './tsconfig.json']
    console.log(`npx ${commands.join(' ')}`)
    api = spawn('npx', commands, { stdio: 'inherit' })
    api.on('close', function (code) {
      if (code === 8) {
        gulp.log('Error detected, waiting for changes...')
      }
    })
    resolve()
  })

}

const startQueue = () => {
  return new Promise((resolve, reject) => {
    if (api) api.kill()
    const commands = ['ts-node', '--files', '-r', 'tsconfig-paths/register', '--transpile-only', 'src/queue.ts', '--project', './tsconfig.json']
    console.log(`npx ${commands.join(' ')}`)
    api = spawn('npx', commands, { stdio: 'inherit' })
    api.on('close', function (code) {
      if (code === 8) {
        gulp.log('Error detected, waiting for changes...')
      }
    })
    resolve()
  })

}

const runCommand = (path, command) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: path }, function (error, stdout, stderr) {
      if (error || stderr) {
        console.log(path)
        console.log(error || stderr)
        return reject(error || stderr)
      }
      console.log(stdout)
      resolve()
    })
  })
}

gulp.task('api-start', () => {
  return new Promise((resolve, reject) => {
    startServer()
      .then(resolve)
      .catch(reject)
  })
})

gulp.task('cluster-start', () => {
  return new Promise((resolve, reject) => {
    startCluster()
      .then(resolve)
      .catch(reject)
  })
})

gulp.task('queue-start', () => {
  return new Promise((resolve, reject) => {
    startQueue()
      .then(resolve)
      .catch(reject)
  })
})

gulp.task('dev', () => {
  return startServer()
    .then(() => gulp.watch(['./src/**/*.ts', '!./src/types/**/*.ts'], gulp.series('api-start')))
})

gulp.task('cluster', () => {
  return startCluster()
    .then(() => gulp.watch(['./src/**/*.ts', '!./src/types/**/*.ts'], gulp.series('cluster-start')))
})

gulp.task('queues', () => {
  return startQueue()
    .then(() => gulp.watch(['./src/**/*.ts', '!./src/types/**/*.ts'], gulp.series('queue-start')))
})













