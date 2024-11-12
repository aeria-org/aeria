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

  expect(person1.equals(project.created_by._id)).toBeTruthy()
  expect(user1.equals(project.user_id)).toBeTruthy()
  expect(user1.equals(project.created_by.user._id)).toBeTruthy()
  expect(file1.equals(project.created_by.user.picture_file._id)).toBeTruthy()
})

test('respects the "populate" property', async () => {
  const {
    user1,
    project,
  } = await documents

  expect(user1.equals(project.user_id)).toBeTruthy()
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

  expect(person1.equals(project.stakeholders.owner._id)).toBeTruthy()
  expect(user1.equals(project.stakeholders.owner.user._id)).toBeTruthy()
  expect(file1.equals(project.stakeholders.owner.user.picture_file._id)).toBeTruthy()
  expect(person2.equals(project.stakeholders.qa._id)).toBeTruthy()
  expect(user2.equals(project.stakeholders.qa.user._id)).toBeTruthy()
  expect(file2.equals(project.stakeholders.qa.user.picture_file._id)).toBeTruthy()
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

  expect(project.cronogram[0].assignments[0].responsibles.length).toBe(3)
  expect(project.cronogram[0].assignments[0].name).toBe('assignment 1')
  expect(project.cronogram[0].assignments[0].status).toBe('pending')

  expect(person1.equals(project.cronogram[0].assignments[0].responsibles[0]._id)).toBeTruthy()
  expect(user1.equals(project.cronogram[0].assignments[0].responsibles[0].user._id)).toBeTruthy()
  expect(file1.equals(project.cronogram[0].assignments[0].responsibles[0].user.picture_file._id)).toBeTruthy()
  expect(person2.equals(project.cronogram[0].assignments[0].responsibles[1]._id)).toBeTruthy()
  expect(user2.equals(project.cronogram[0].assignments[0].responsibles[1].user._id)).toBeTruthy()
  expect(file2.equals(project.cronogram[0].assignments[0].responsibles[1].user.picture_file._id)).toBeTruthy()
  expect(project.cronogram[0].assignments[0].responsibles[2].user.picture_file === null).toBeTruthy()
})

test('populates arrays inside arrays', async () => {
  const {
    user1,
    user2,
    user3,
    project,
  } = await documents

  expect(project.cronogram_normalized[0].people[0].friends!.length).toBe(2)
  expect(project.cronogram_normalized[0].people[1].friends!.length).toBe(1)
  expect(project.cronogram_normalized[1].people[0].friends).toBeNull()
  expect(user2.equals(project.cronogram_normalized[0].people[0].friends![0]._id)).toBeTruthy()
  expect(user3.equals(project.cronogram_normalized[0].people[0].friends![1]._id)).toBeTruthy()
  expect(user1.equals(project.cronogram_normalized[0].people[1].friends![0]._id)).toBeTruthy()
})

test('populates circular references', async () => {
  const { circularA2 } = await circularDocuments
  expect(circularA2.name).toBe('rec a2')
  expect(circularA2.circularA!.name).toBe('rec a1')
  expect(circularA2.circularB!.name).toBe('rec b1')
  expect(circularA2.circularB_array![0].name).toBe('rec b1')
  expect(circularA2.circularB_array![0].circularA.name).toBe('rec a1')
})

test('populates circular references', async () => {
  const { post1, post2 } = await documents
  console.log(JSON.stringify(post2, null, 2))
})

