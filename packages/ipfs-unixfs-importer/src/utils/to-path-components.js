const toPathComponents = (path = '') => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\/]|\\\/)+/g) || [])
    .filter(Boolean)
}

export default toPathComponents
