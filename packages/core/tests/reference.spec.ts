import type { Token } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import assert from 'assert'
import { createContext, getDatabase, insert, ObjectId } from '../dist/index.js'

describe('Reference engine', () => {
  it('returns a validation error on shallow invalid property', async () => {
    await getDatabase()
    const token: Token = {
      authenticated: false,
      sub: null,
    }

    const userContext = await createContext({
      collectionName: 'user',
      token,
    })

    const personContext = await createContext({
      collectionName: 'person',
      token,
    })

    const projectContext = await createContext({
      collectionName: 'project',
      token,
    })

    const user1 = throwIfError(await insert({
      what: {
        name: 'john',
        email: 'john@test',
        roles: [],
      }
    }, userContext))

    const user2 = throwIfError(await insert({
      what: {
        name: 'terry',
        email: 'terry@test',
        roles: [],
      }
    }, userContext))

    const person1 = throwIfError(await insert({
      what: {
        name: 'john',
        user: user1._id,
      }
    }, personContext))

    const person2 = throwIfError(await insert({
      what: {
        name: 'terry',
        user: user2._id,
      }
    }, personContext))

    const project = throwIfError(await insert({
      what: {
        created_by: person1._id,
        stakeholders: {
          owner: person1._id,
          qa: person2._id
        },
        cronogram: {
          days: [
            {
              date: {
                day: 10,
                month: 7,
                year: 2000,
              },
              assignments: [
                {
                  name: 'assignment 1',
                  status: 'pending',
                  responsibles: [
                    person1._id,
                    person2._id,
                    new ObjectId(),
                  ]
                }
              ]
            }
          ]
        }
      }
    }, projectContext))

    assert(person1._id.equals(project.created_by._id))
    assert(person1._id.equals(project.stakeholders.owner._id))
    assert(person2._id.equals(project.stakeholders.qa._id))
    assert(person1._id.equals(project.cronogram.days[0].assignments[0].responsibles[0]._id))
    assert(person2._id.equals(project.cronogram.days[0].assignments[0].responsibles[1]._id))
    assert(project.cronogram.days[0].assignments[0].responsibles.length === 2)
    assert(project.cronogram.days[0].assignments[0].name === 'assignment 1')
    assert(project.cronogram.days[0].assignments[0].status === 'pending')

    console.log(JSON.stringify(project, null, 2))
  })

})
