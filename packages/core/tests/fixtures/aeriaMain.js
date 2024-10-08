// @ts-check
const { init, user, file, tempFile, get } = require('aeria')

exports.default = init({
  collections: {
    user,
    file,
    tempFile,
    circularA: {
      functions: {
        get,
      },
      description: {
        $id: 'circularA',
        required: [],
        properties: {
          name: {
            type: 'string'
          },
          circularA: {
            $ref: 'circularA',
            populate: [
              'circularB',
              'circularB_array',
            ]
          },
          circularB: {
            $ref: 'circularB'
          },
          circularB_array: {
            type: 'array',
            items: {
              $ref: 'circularB',
              populate: [
                'circularA',
              ]
            }
          }
        }
      }
    },
    circularB: {
      functions: {
        get,
      },
      description: {
        $id: 'circularA',
        required: [],
        properties: {
          name: {
            type: 'string',
          },
          circularA: {
            $ref: 'circularA'
          },
        }
      }
    },
    person: {
      functions: {
        get
      },
      description: {
        $id: 'person',
        required: [],
        properties: {
          name: {
            type: 'string'
          },
          user: {
            $ref: 'user',
            populate: [
              'picture_file',
            ],
          },
          friends: {
            type: 'array',
            items: {
              $ref: 'user',
            },
          },
        },
      },
    },
    day: {
      description: {
        $id: 'day',
        properties: {
          people: {
            type: 'array',
            items: {
              $ref: 'person',
              populate: [
                'friends',
              ]
            }
          }
        }
      },
    },
    project: {
      functions: {
        get,
      },
      description: {
        $id: 'project',
        required: [],
        properties: {
          user_id: {
            $ref: 'user',
            populate: [],
          },
          created_by: {
            $ref: 'person',
            populate: [
              'user',
            ],
          },
          stakeholders: {
            type: 'object',
            properties: {
              owner: {
                $ref: 'person',
                populate: [
                  'user',
                ],
              },
              qa: {
                $ref: 'person',
                populate: [
                  'user',
                ],
              }
            }
          },
          cronogram: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: {
                  type: 'object',
                  properties: {
                    day: {
                      type: 'number'
                    },
                    month: {
                      type: 'number'
                    },
                    year: {
                      type: 'number'
                    },
                  }
                },
                assignments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      },
                      status: {
                        enum: [
                          'pending',
                          'complete',
                        ]
                      },
                      responsibles: {
                        type: 'array',
                        items: {
                          $ref: 'person',
                          populate: [
                            'user',
                            'friends',
                          ],
                        }
                      }
                    }
                  }
                }
              }
            },
          },
          cronogram_normalized: {
            type: 'array',
            items: {
              $ref: 'day',
              populate: [
                'people',
              ]
            }
          }
        }
      }
    }
  }
})
