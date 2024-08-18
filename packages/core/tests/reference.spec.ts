import assert from 'assert'
import { documents } from './fixtures/documents'

describe('Reference engine', () => {
  it('populates top level references', async () => {
    const {
      file1,
      user1,
      person1,
      project,
    } = await documents

    assert(person1.equals(project.created_by._id))
    assert(user1.equals(project.created_by.user._id))
    assert(file1.equals(project.created_by.user.picture_file._id))

  })

  it('populates deep-nested references', async () => {
    const {
      file1,
      file2,
      user1,
      user2,
      person1,
      person2,
      project,
    } = await documents

    assert(person1.equals(project.stakeholders.owner._id))
    assert(user1.equals(project.stakeholders.owner.user._id))
    assert(file1.equals(project.stakeholders.owner.user.picture_file._id))
    assert(person2.equals(project.stakeholders.qa._id))
    assert(user2.equals(project.stakeholders.qa.user._id))
    assert(file2.equals(project.stakeholders.qa.user.picture_file._id))
  })

  it('populates array-nested references', async () => {
    const {
      file1,
      file2,
      user1,
      user2,
      person1,
      person2,
      project,
    } = await documents

    assert(project.cronogram.days[0].assignments[0].responsibles.length === 3)
    assert(project.cronogram.days[0].assignments[0].name === 'assignment 1')
    assert(project.cronogram.days[0].assignments[0].status === 'pending')

    assert(person1.equals(project.cronogram.days[0].assignments[0].responsibles[0]._id))
    assert(user1.equals(project.cronogram.days[0].assignments[0].responsibles[0].user._id))
    assert(file1.equals(project.cronogram.days[0].assignments[0].responsibles[0].user.picture_file._id))
    assert(person2.equals(project.cronogram.days[0].assignments[0].responsibles[1]._id))
    assert(user2.equals(project.cronogram.days[0].assignments[0].responsibles[1].user._id))
    assert(file2.equals(project.cronogram.days[0].assignments[0].responsibles[1].user.picture_file._id))
    assert(project.cronogram.days[0].assignments[0].responsibles[2].user.picture_file === null)

  })
})

