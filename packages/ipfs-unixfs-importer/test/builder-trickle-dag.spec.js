/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const builder = require('../src/dag-builder/file/trickle')
const asAsyncIterable = require('./helpers/as-async-iterable')

/**
 * @param {number} max
 */
const createValues = (max) => {
  const output = []

  for (let i = 0; i < max; i++) {
    output.push(i)
  }

  return output
}

/**
 * @param {*} leaves
 */
function reduce (leaves) {
  if (leaves.length > 1) {
    return { children: leaves }
  } else {
    return leaves[0]
  }
}

const options = {
  maxChildrenPerNode: 3,
  layerRepeat: 2
}

describe('builder: trickle', () => {
  it('reduces one value into itself', async () => {
    // @ts-ignore
    const result = await builder(asAsyncIterable([1]), reduce, options)

    expect(result).to.deep.equal(1)
  })

  it('reduces 3 values into parent', async () => {
    // @ts-ignore
    const result = await builder(createValues(3), reduce, options)

    expect(result).to.deep.equal({
      children: [
        0,
        1,
        2
      ]
    })
  })

  it('reduces 6 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(6), reduce, options)

    expect(result).to.deep.equal({
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
    })
  })

  it('reduces 9 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(9), reduce, options)

    expect(result).to.deep.equal({
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
    })
  })

  it('reduces 12 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(12), reduce, options)

    expect(result).to.deep.equal({
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
    })
  })

  it('reduces 21 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(21), reduce, options)

    expect(result).to.deep.equal({
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
    })
  })

  it('reduces 68 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(68), reduce, options)

    expect(result).to.deep.equal(
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
                      67
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    )
  })

  it('reduces 93 values correctly', async () => {
    // @ts-ignore
    const result = await builder(createValues(93), reduce, options)

    expect(result).to.deep.equal(
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
                  92
                ]
              }
            ]
          }
        ]
      }
    )
  })
})
