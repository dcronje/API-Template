
class CodeGen {

  tabIndex: any
  tab: any
  tabs: any[]
  code: any[]
  cursorLocation: any

  constructor() {
    this.tabIndex = 0
    this.tab = '  '
    this.tabs = []
    this.code = []
    this.cursorLocation = 0
  }

  reset() {
    this.tabIndex = 0
    this.cursorLocation = 0
    this.code = []
    this.tabs = []
  }

  write(location: string) {
    // let codeString = this.toString()
    // fs.writeFileSync(codeString, location)
  }

  toString() {
    let codeString = ''
    this.code.unshift()
    let isBlank = false
    let shouldAdd = true
    for (let l = this.code.length - 1; l >= 0; l--) {
      if (this.code[l] === '') {
        this.code.splice(l, 1)
        this.tabs.splice(l, 1)
      } else {
        break
      }
    }
    this.code.forEach((line, index) => {
      if (line.trim() === '') {
        if (!isBlank) {
          isBlank = true
        } else {
          shouldAdd = false
        }
      } else {
        isBlank = false
        shouldAdd = true
      }
      if (shouldAdd) {
        codeString += `${this.addTabs(this.tabs[index])}${line}\n`
      }
    })
    return codeString
  }

  inset() {
    this.tabIndex += 1
  }

  outset() {
    this.tabIndex -= 1
  }

  addTabs(amount: any) {
    let tabString = ''
    for (let t = 0; t < amount; t++) {
      tabString += this.tab
    }
    return tabString
  }

  appendLine(code: string) {
    this.code[this.cursorLocation - 1] += code
  }

  addLine(line: any) {
    if (line !== '') {
      this.tabs[this.cursorLocation] = this.tabIndex
    } else {
      this.tabs[this.cursorLocation] = 0
    }
    while (this.code.length - 1 < this.cursorLocation) {
      this.code.push('')
    }
    this.code.splice(this.cursorLocation, 0, `${line}`)
    this.cursorLocation++
  }

  addInsetLine(line: any) {
    this.inset()
    this.addLine(line)
  }

  addOutsetLine(line: any) {
    this.outset()
    this.addLine(line)
  }

  addImport(name: any, from: any, as: any) {
    this.addLine(`import ${name}`)
    if (as) {
      this.appendLine(` as ${as}`)
    }
    this.appendLine(` from '${from}'`)
  }

  addExport(name: any) {
    this.addLine(`export default ${name}`)
  }

  addMultiImport(names: any, from: any) {
    this.addLine('import {')
    this.inset()
    names.forEach((item) => {
      this.addLine(`${item},`)
    })
    this.addOutsetLine(`} from '${from}'`)
  }

  addMultiExport(names: any) {
    this.addLine('export {')
    this.inset()
    names.forEach((name) => {
      this.addLine(`${name},`)
    })
    this.outset()
    this.addLine('}')
  }

  moveCursorToBottom() {
    this.cursorLocation = this.code.length + 1
  }

  moveCursorBack(amount = 1) {
    this.cursorLocation -= amount
  }

  moveCursorForward(amount = 1) {
    this.cursorLocation += amount
  }

  openClass(name: any, ext: any) {
    this.tabIndex = 0
    this.moveCursorToBottom()
    this.addLine(`class ${name}`)
    if (ext) {
      this.appendLine(` extends ${ext}`)
    }
    this.appendLine(' {')
    this.addLine('')
    this.tabIndex += 1
  }

  closeClass() {
    this.tabIndex -= 1
    this.addLine('}')
    this.addLine('')
  }

  openFunction(name: any, args: any) {
    this.addLine(`${name}(`)
    if (typeof args === 'string') {
      this.appendLine(args)
    } else if (Array.isArray(args)) {
      let hasAddedArg = false
      args.forEach((arg) => {
        if (hasAddedArg) {
          this.appendLine(', ')
        }
        this.appendLine(arg)
        hasAddedArg = true
      })
    }
    this.appendLine(') {')
    this.tabIndex += 1
  }

  closeFunction() {
    this.tabIndex -= 1
    this.addLine('}')
    this.addLine('')
  }

  addBlock(string: any) {
    const lines = string.split('\n')
    if (lines.length && lines[0].trim() === '') {
      lines.splice(0, 1)
    }
    if (lines.length && lines[lines.length - 1].trim() === '') {
      lines.splice(lines.length - 1, 1)
    }
    let insetDeduction = 0
    for (let l = 0; l < lines.length; l++) {
      const tabs = lines[l].match(/^(\s*).*$/)
      let insetAmount = 0
      if (tabs.length > 1) {
        insetAmount = tabs[1].length / 2
      }
      if (l === 0) {
        insetDeduction = insetAmount
      }
      this.tabs[this.cursorLocation] = this.tabIndex + (insetAmount - insetDeduction)
      while (this.code.length - 1 < this.cursorLocation) {
        this.code.push('')
      }
      this.code.splice(this.cursorLocation, 0, `${lines[l].trim()}`)
      this.cursorLocation++
    }
  }

}

export default CodeGen
