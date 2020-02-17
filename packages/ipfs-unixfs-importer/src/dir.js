'use strict'

module.exports = class Dir {
  constructor (props, options) {
    this.options = options || {}
    Object.assign(this, props)
  }
}
