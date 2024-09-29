import { Logger, QueryRunner } from 'typeorm'

const tableFilters = ['menu']

export class QueryLogger implements Logger {

  /**
     * Logs query and parameters used in it.
     */
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    for (let t = 0; t < tableFilters.length; t++) {
      if (query.match(`"${tableFilters[t]}"`)) {
        console.log('********** QUERY **********')
        console.log(query)
        console.log('***************************')
        console.log(JSON.stringify(parameters, null, 2))
        console.log('*********** END ***********')
      }
    }
  }

  /**
   * Logs query that is failed.
   */
  logQueryError(error: string | Error, query: string, parameters?: any[]): any {
    for (let t = 0; t < tableFilters.length; t++) {
      if (query.match(`"${tableFilters[t]}"`)) {
        console.log('********** ERROR **********')
        console.log(error)
        console.log(query)
        console.log('***************************')
        console.log(JSON.stringify(parameters, null, 2))
        console.log('*********** END ***********')
      }
    }
  }

  /**
   * Logs query that is slow.
   */
  logQuerySlow(time: number, query: string, parameters?: any[]): any {
    for (let t = 0; t < tableFilters.length; t++) {
      if (query.match(`"${tableFilters[t]}"`)) {
        console.log('********** SLOW ***********')
        console.log(`TIME: ${time}`)
        console.log(query)
        console.log('***************************')
        console.log(JSON.stringify(parameters, null, 2))
        console.log('*********** END ***********')
      }
    }
  }

  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string): any {
    console.log('********** BUILD **********')
    console.log(message)
    console.log('*********** END ***********')
  }

  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string): any {
    console.log('********** MIGRATE *********')
    console.log(message)
    console.log('*********** END ***********')
  }

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(level: 'log' | 'info' | 'warn', message: any): any {
    console.log(level, message)
  }

}
