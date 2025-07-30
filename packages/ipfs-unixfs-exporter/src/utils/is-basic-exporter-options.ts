import type { BasicExporterOptions } from '../index.js'

export function isBasicExporterOptions (obj?: any): obj is BasicExporterOptions {
  return obj?.extended === false
}
