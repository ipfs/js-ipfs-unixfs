import { BadPathError } from '../../errors.ts'
import { isCID } from './is-cid.ts'

export interface ObjectPathResult {
  /**
   * The last resolved value within the object
   */
  value: any

  /**
   * The path within the object the value was resolved at
   */
  path: string,

  /**
   * If the value was a CID, these are the remaining unresolved path segments
   */
  rest: string[]
}

export function resolveObjectPath (object: any, path: string[]): ObjectPathResult {
  let value: any
  let i = 0
  let resolved = ''

  while (i < path.length) {
    const key = path[i]
    i++

    if (!Object.hasOwnProperty.call(object, key)) {
      throw new BadPathError(`Object did not have key "${key}"`)
    }

    resolved += `/${key}`
    value = object[key]
    object = value

    // allow resolver to traverse DAG
    if (isCID(value)) {
      break
    }
  }

  return {
    value,
    rest: path.slice(i),
    path: resolved.substring(1)
  }
}
