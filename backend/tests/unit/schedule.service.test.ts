import { describe, it, expect, vi, beforeEach } from 'vitest'

// These tests validate the conflict detection logic conceptually.
// Integration tests in tests/integration/ run against a real DB.

describe('Schedule Conflict Detection', () => {
  it('detects overlap when two events share time', () => {
    const eventA = {
      startTime: new Date('2027-03-14T10:00:00-05:00'),
      endTime: new Date('2027-03-14T11:30:00-05:00'),
    }
    const eventB = {
      startTime: new Date('2027-03-14T11:00:00-05:00'),
      endTime: new Date('2027-03-14T12:00:00-05:00'),
    }

    const overlaps =
      eventA.startTime < eventB.endTime && eventA.endTime > eventB.startTime

    expect(overlaps).toBe(true)
  })

  it('allows back-to-back events', () => {
    const eventA = {
      startTime: new Date('2027-03-14T10:00:00-05:00'),
      endTime: new Date('2027-03-14T11:00:00-05:00'),
    }
    const eventB = {
      startTime: new Date('2027-03-14T11:00:00-05:00'),
      endTime: new Date('2027-03-14T12:00:00-05:00'),
    }

    const overlaps =
      eventA.startTime < eventB.endTime && eventA.endTime > eventB.startTime

    expect(overlaps).toBe(false)
  })

  it('detects contained events', () => {
    const outer = {
      startTime: new Date('2027-03-14T10:00:00-05:00'),
      endTime: new Date('2027-03-14T14:00:00-05:00'),
    }
    const inner = {
      startTime: new Date('2027-03-14T11:00:00-05:00'),
      endTime: new Date('2027-03-14T12:00:00-05:00'),
    }

    const overlaps =
      outer.startTime < inner.endTime && outer.endTime > inner.startTime

    expect(overlaps).toBe(true)
  })

  it('allows events on different days', () => {
    const eventA = {
      startTime: new Date('2027-03-14T10:00:00-05:00'),
      endTime: new Date('2027-03-14T11:00:00-05:00'),
    }
    const eventB = {
      startTime: new Date('2027-03-15T10:00:00-05:00'),
      endTime: new Date('2027-03-15T11:00:00-05:00'),
    }

    const overlaps =
      eventA.startTime < eventB.endTime && eventA.endTime > eventB.startTime

    expect(overlaps).toBe(false)
  })
})
