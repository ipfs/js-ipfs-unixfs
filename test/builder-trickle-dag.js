/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream')

const builder = require('../src/builder/trickle')

function reduce (leaves, callback) {
  if (leaves.length > 1) {
    setTimeout(() => callback(null, { children: leaves }), 10)
  } else {
    setTimeout(() => callback(null, leaves[0]), 10)
  }
}

const options = {
  maxChildrenPerNode: 3,
  layerRepeat: 2
}

describe('builder: trickle', () => {
  it('reduces one value into itself', callback => {
    pull(
      pull.values([1]),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([1])
        callback()
      })
    )
  })

  it('reduces 3 values into parent', callback => {
    pull(
      pull.count(2),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              0,
              1,
              2
            ]
          }
        ])
        callback()
      })
    )
  })

  it('reduces 6 values correclty', callback => {
    pull(
      pull.count(5),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              0,
              1,
              2,
              {
                children: [
                  3,
                  4,
                  5
                ]
              }
            ]
          }
        ])
        callback()
      })
    )
  })

  it('reduces 9 values correclty', callback => {
    pull(
      pull.count(8),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              0,
              1,
              2,
              {
                children: [
                  3,
                  4,
                  5
                ]
              },
              {
                children: [
                  6,
                  7,
                  8
                ]
              }
            ]
          }
        ])
        callback()
      })
    )
  })

  it('reduces 12 values correclty', callback => {
    pull(
      pull.count(11),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        setTimeout(() => {
          expect(result).to.be.eql([
            {
              children: [
                0,
                1,
                2,
                {
                  children: [
                    3,
                    4,
                    5
                  ]
                },
                {
                  children: [
                    6,
                    7,
                    8
                  ]
                },
                {
                  children: [
                    9,
                    10,
                    11
                  ]
                }
              ]
            }
          ])
          callback()
        }, 100)
      })
    )
  })

  it('reduces 21 values correclty', callback => {
    pull(
      pull.count(20),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              0,
              1,
              2,
              {
                children: [
                  3,
                  4,
                  5
                ]
              },
              {
                children: [
                  6,
                  7,
                  8
                ]
              },
              {
                children: [
                  9,
                  10,
                  11,
                  {
                    children: [
                      12,
                      13,
                      14
                    ]
                  },
                  {
                    children: [
                      15,
                      16,
                      17
                    ]
                  }
                ]
              },
              {
                children: [
                  18,
                  19,
                  20
                ]
              }
            ]
          }
        ])
        callback()
      })
    )
  })

  it('forms correct trickle tree', callback => {
    pull(
      pull.count(99),
      builder(reduce, options),
      pull.collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              0,
              1,
              2,
              {
                children: [
                  3,
                  4,
                  5
                ]
              },
              {
                children: [
                  6,
                  7,
                  8
                ]
              },
              {
                children: [
                  9,
                  10,
                  11,
                  {
                    children: [
                      12,
                      13,
                      14
                    ]
                  },
                  {
                    children: [
                      15,
                      16,
                      17
                    ]
                  }
                ]
              },
              {
                children: [
                  18,
                  19,
                  20,
                  {
                    children: [
                      21,
                      22,
                      23
                    ]
                  },
                  {
                    children: [
                      24,
                      25,
                      26
                    ]
                  }
                ]
              },
              {
                children: [
                  27,
                  28,
                  29,
                  {
                    children: [
                      30,
                      31,
                      32
                    ]
                  },
                  {
                    children: [
                      33,
                      34,
                      35
                    ]
                  },
                  {
                    children: [
                      36,
                      37,
                      38,
                      {
                        children: [
                          39,
                          40,
                          41
                        ]
                      },
                      {
                        children: [
                          42,
                          43,
                          44
                        ]
                      }
                    ]
                  },
                  {
                    children: [
                      45,
                      46,
                      47,
                      {
                        children: [
                          48,
                          49,
                          50
                        ]
                      },
                      {
                        children: [
                          51,
                          52,
                          53
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                children: [
                  54,
                  55,
                  56,
                  {
                    children: [
                      57,
                      58,
                      59
                    ]
                  },
                  {
                    children: [
                      60,
                      61,
                      62
                    ]
                  },
                  {
                    children: [
                      63,
                      64,
                      65,
                      {
                        children: [
                          66,
                          67,
                          68
                        ]
                      },
                      {
                        children: [
                          69,
                          70,
                          71
                        ]
                      }
                    ]
                  },
                  {
                    children: [
                      72,
                      73,
                      74,
                      {
                        children: [
                          75,
                          76,
                          77
                        ]
                      },
                      {
                        children: [
                          78,
                          79,
                          80
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                children: [
                  81,
                  82,
                  83,
                  {
                    children: [
                      84,
                      85,
                      86
                    ]
                  },
                  {
                    children: [
                      87,
                      88,
                      89
                    ]
                  },
                  {
                    children: [
                      90,
                      91,
                      92,
                      {
                        children: [
                          93,
                          94,
                          95
                        ]
                      },
                      {
                        children: [
                          96,
                          97,
                          98
                        ]
                      }
                    ]
                  },
                  99
                ]
              }
            ]
          }
        ])
        callback()
      })
    )
  })
})
