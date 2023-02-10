export const toPathComponents = (path: string = ''): string[] => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\/]|\\\/)+/g) ?? [])
    .filter(Boolean)
}
