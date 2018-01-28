import setHistoryStartId from './setHistoryStartId'
import createLabels from './createLabels'
import createFilter from './createFilter'

export function setup(userId) {
  setHistoryStartId(userId)

  return createLabels(userId).then(() => createFilter(userId))
}
