import type { Condition, FinalOperator } from '@aeriajs/types'
import { expect, test } from 'vitest'
import { evaluateCondition } from '../dist/index.js'

test('evaluates equality', () => {
  const condition: Condition = {
    operator: 'equal',
    term1: 'n',
    term2: 1,
  }

  expect(evaluateCondition({ n: 1 }, condition).satisfied).toBeTruthy()
  expect(evaluateCondition({ n: 2 }, condition).satisfied).toBeFalsy()
})

test('evaluates negation', () => {
  const condition: Condition = {
    not: {
      operator: 'equal',
      term1: 'n',
      term2: 1,
    }
  }

  expect(evaluateCondition({ n: 2 }, condition).satisfied).toBeTruthy()
  expect(evaluateCondition({ n: 1 }, condition).satisfied).toBeFalsy()
})

test('evaluates arithmetic comparisons', () => {
  const arithmeticCondition = (operator: FinalOperator): Condition => {
    return {
      operator,
      term1: 'n',
      term2: 1,
    }
  }

  expect(evaluateCondition({ n: 0 }, arithmeticCondition('lt')).satisfied).toBeTruthy()
  expect(evaluateCondition({ n: 1 }, arithmeticCondition('lt')).satisfied).toBeFalsy()
  expect(evaluateCondition({ n: 2 }, arithmeticCondition('gt')).satisfied).toBeTruthy()
  expect(evaluateCondition({ n: 1 }, arithmeticCondition('gt')).satisfied).toBeFalsy()
  expect(evaluateCondition({ n: 1 }, arithmeticCondition('lte')).satisfied).toBeTruthy()
  expect(evaluateCondition({ n: 1 }, arithmeticCondition('gte')).satisfied).toBeTruthy()
})

test('evaluates "in" array operator', () => {
  const condition: Condition = {
    operator: 'in',
    term1: 'arr',
    term2: 'banana',
  }

  expect(evaluateCondition({
    arr: [
      'apple',
      'banana',
    ]
  }, condition).satisfied).toBeTruthy()

  expect(evaluateCondition({
    arr: [
      'apple',
    ]
  }, condition).satisfied).toBeFalsy()

  expect(evaluateCondition({
    arr: null,
  }, condition).satisfied).toBeFalsy()
})

test('evaluates "and" logic operator', () => {
  const condition: Condition = {
    and: [
      {
        operator: 'equal',
        term1: 'x',
        term2: 1,
      },
      {
        operator: 'equal',
        term1: 'y',
        term2: 2,
      }
    ]
  }
  expect(evaluateCondition({
    x: 1,
    y: 2,
  }, condition).satisfied).toBeTruthy()

  expect(evaluateCondition({
    x: 1,
    y: 3,
  }, condition).satisfied).toBeFalsy()
})

test('evaluates "or" logic operator', () => {
  const condition: Condition = {
    or: [
      {
        operator: 'equal',
        term1: 'x',
        term2: 1,
      },
      {
        operator: 'equal',
        term1: 'y',
        term2: 2,
      }
    ]
  }

  expect(evaluateCondition({
    x: 0,
    y: 2,
  }, condition).satisfied).toBeTruthy()

  expect(evaluateCondition({
    x: 0,
    y: 0,
  }, condition).satisfied).toBeFalsy()
})

test('evaluates nested expressions', () => {
  const condition: Condition = {
    operator: 'equal',
    term1: 'x',
    term2: {
      operator: 'equal',
      term1: 'y',
      term2: 1,
    },
  }

  expect(evaluateCondition({
    x: true,
    y: 1,
  }, condition).satisfied).toBeTruthy()

  expect(evaluateCondition({
    x: false,
    y: 1,
  }, condition).satisfied).toBeFalsy()

  expect(evaluateCondition({
    x: true,
    y: 2,
  }, condition).satisfied).toBeFalsy()
})

