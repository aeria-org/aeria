// @ts-check
const { init, user, file, get } = require('aeria')

exports.default = init({
  collections: {
    user,
    file,
    person: {
      functions: {
        get
      },
      description: {
        $id: 'person',
        indexes: [
          'name'
        ],
        properties: {
          name: {
            type: 'string'
          },
          user: {
            $ref: 'user',
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
        properties: {
          created_by: {
            $ref: 'person'
          },
          stakeholders: {
            type: 'object',
            properties: {
              owner: {
                $ref: 'person',
              },
              qa: {
                $ref: 'person',
              }
            }
          },
          cronogram: {
            type: 'object',
            properties: {
              days: {
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
                              $ref: 'person'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})
