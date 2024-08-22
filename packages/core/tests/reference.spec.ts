import { expect, test } from 'vitest'
import { documents } from './fixtures/documents.js'
import { circularDocuments } from './fixtures/circularDocuments.js'

test('populates top level references', async () => {
  const {
    file1,
    user1,
    person1,
    project,
  } = await documents

  expect(person1.equals(project.created_by._id)).toBe(true)
  expect(user1.equals(project.user_id)).toBe(true)
  expect(user1.equals(project.created_by.user._id)).toBe(true)
  expect(file1.equals(project.created_by.user.picture_file._id)).toBe(true)
})

test('respects the "populate" property', async () => {
  const {
    user1,
    project,
  } = await documents

  expect(user1.equals(project.user_id)).toBe(true)
})

test('populates deep-nested references', async () => {
  const {
    file1,
    file2,
    user1,
    user2,
    person1,
    person2,
    project,
  } = await documents

  expect(person1.equals(project.stakeholders.owner._id)).toBe(true)
  expect(user1.equals(project.stakeholders.owner.user._id)).toBe(true)
  expect(file1.equals(project.stakeholders.owner.user.picture_file._id)).toBe(true)
  expect(person2.equals(project.stakeholders.qa._id)).toBe(true)
  expect(user2.equals(project.stakeholders.qa.user._id)).toBe(true)
  expect(file2.equals(project.stakeholders.qa.user.picture_file._id)).toBe(true)
})

test('populates array-nested references', async () => {
  const {
    file1,
    file2,
    user1,
    user2,
    person1,
    person2,
    project,
  } = await documents

  expect(project.cronogram.days[0].assignments[0].responsibles.length).toBe(3)
  expect(project.cronogram.days[0].assignments[0].name).toBe('assignment 1')
  expect(project.cronogram.days[0].assignments[0].status).toBe('pending')

  expect(person1.equals(project.cronogram.days[0].assignments[0].responsibles[0]._id)).toBe(true)
  expect(user1.equals(project.cronogram.days[0].assignments[0].responsibles[0].user._id)).toBe(true)
  expect(file1.equals(project.cronogram.days[0].assignments[0].responsibles[0].user.picture_file._id)).toBe(true)
  expect(person2.equals(project.cronogram.days[0].assignments[0].responsibles[1]._id)).toBe(true)
  expect(user2.equals(project.cronogram.days[0].assignments[0].responsibles[1].user._id)).toBe(true)
  expect(file2.equals(project.cronogram.days[0].assignments[0].responsibles[1].user.picture_file._id)).toBe(true)
  expect(project.cronogram.days[0].assignments[0].responsibles[2].user.picture_file === null).toBe(true)
})

test('populates circular references', async () => {
  const { circularA2 } = await circularDocuments
  expect(circularA2.name).toBe('rec a2')
  expect(circularA2.circularA.name).toBe('rec a1')
  expect(circularA2.circularB.name).toBe('rec b1')
  expect(circularA2.circularB_array[0].name).toBe('rec b1')
  expect(circularA2.circularB_array[0].circularA.name).toBe('rec a1')
})



