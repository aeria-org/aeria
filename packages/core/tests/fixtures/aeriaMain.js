// @ts-check
import { init, user, file, tempFile, get, insert, remove, removeAll } from 'aeria'

export default init({
  collections: {
    user,
    file,
    tempFile,
    comment: {
      description: {
        $id: 'comment',
        properties: {
          meta: {
            type: 'object',
            properties: {
              user: {
                $ref: 'user',
                inline: true,
              }
            }
          }
        }
      }
    },
    post: {
      functions: {
        get,
      },
      description: {
        $id: 'post',
        properties: {
          title: {
            type: 'string'
          },
          single_comment: {
            $ref: 'comment',
            inline: true,
          },
          comments: {
            type: 'array',
            items: {
              $ref: 'comment',
              inline: true,
            }
          },
        },
      },
    },
    featured: {
      functions: {
        get,
      },
      description: {
        $id: 'featured',
        properties: {
          post: {
            $ref: 'post',
            inline: true,
          }
        },
      },
    },
    circularA: {
      functions: {
        get,
        insert,
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
          },
          circularAs: {
            type: 'array',
            items: {
              $ref: 'circularA',
              inline: true,
            },
          },
          circularB: {
            $ref: 'circularB',
            inline: true,
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
        remove,
      },
      description: {
        $id: 'circularB',
        required: [],
        properties: {
          name: {
            type: 'string',
          },
          circularA: {
            $ref: 'circularA',
            inline: true,
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
