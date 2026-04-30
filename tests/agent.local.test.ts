import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Agent } from '../src/agent.local'
import { SchedulerError } from '../src/methods/local/schedule'

describe('Agent (LOCAL mode)', () => {
  describe('constructor', () => {
    it('creates agent with agentId', () => {
      const agent = new Agent({ agentId: 'test-agent' })
      expect(agent.agentId).toBe('test-agent')
    })

    it('generates agentId when not provided', () => {
      const agent = new Agent({})
      expect(agent.agentId).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('creates scheduler instance', () => {
      const agent = new Agent({})
      expect(agent.scheduler).toBeDefined()
    })
  })

  describe('getDb()', () => {
    it('returns Dexie instance', () => {
      const agent = new Agent({ agentId: 'test-db-agent' })
      const db = agent.getDb()
      expect(db.name).toBe('db-test-db-agent')
    })
  })

  describe('scheduler', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('status()', () => {
      it('returns scheduler status', async () => {
        const agent = new Agent({ agentId: 'status-test' })
        const result = await agent.scheduler.status()
        expect(result.running).toBe(true)
        expect(result.tasks).toBe(0)
      })
    })

    describe('list()', () => {
      it('returns empty list initially', async () => {
        const agent = new Agent({ agentId: 'list-test' })
        const result = await agent.scheduler.list()
        expect(result.count).toBe(0)
        expect(result.tasks).toEqual([])
      })
    })

    describe('add()', () => {
      it('adds task with agentTurn payload', async () => {
        const agent = new Agent({ agentId: 'add-test' })
        const result = await agent.scheduler.add({
          name: 'Test task',
          schedule: { kind: 'at', at: '2026-05-01T09:00:00Z' },
          payload: { kind: 'agentTurn', message: 'Hello' },
        })
        expect(result.id).toBeDefined()
        expect(result.name).toBe('Test task')
        expect(result.enabled).toBe(true)
      })

      it('adds task with chatInject payload', async () => {
        const agent = new Agent({ agentId: 'add-test-chat' })
        const result = await agent.scheduler.add({
          name: 'Chat task',
          schedule: { kind: 'every', everyMs: 60000 },
          payload: { kind: 'chatInject', chatId: 'chat-123', message: 'Hello' },
        })
        expect(result.id).toBeDefined()
      })

      it('adds task with invokeWorkflow payload', async () => {
        const agent = new Agent({ agentId: 'add-test-workflow' })
        const result = await agent.scheduler.add({
          name: 'Workflow task',
          schedule: { kind: 'cron', expr: '0 9 * * 1-5' },
          payload: { kind: 'invokeWorkflow', workflowName: 'daily-report', workflowParams: { type: 'full' } },
        })
        expect(result.id).toBeDefined()
      })

      it('throws error for invalid payload kind', async () => {
        const agent = new Agent({ agentId: 'add-invalid' })
        await expect(agent.scheduler.add({
          name: 'Invalid',
          schedule: { kind: 'at' },
          payload: { kind: 'invalid' as any, message: '' },
        })).rejects.toThrow(SchedulerError)
      })

      it('throws error for missing required fields', async () => {
        const agent = new Agent({ agentId: 'add-missing' })
        await expect(agent.scheduler.add({
          name: '',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })).rejects.toThrow('job.name is required')
      })

      it('throws error for missing chatInject chatId', async () => {
        const agent = new Agent({ agentId: 'add-no-chatid' })
        await expect(agent.scheduler.add({
          name: 'Test',
          schedule: { kind: 'at' },
          payload: { kind: 'chatInject', chatId: '', message: 'test' },
        })).rejects.toThrow('payload.chatId is required')
      })

      it('throws error for missing invokeWorkflow workflowName', async () => {
        const agent = new Agent({ agentId: 'add-no-workflow' })
        await expect(agent.scheduler.add({
          name: 'Test',
          schedule: { kind: 'at' },
          payload: { kind: 'invokeWorkflow', workflowName: '' },
        })).rejects.toThrow('payload.workflowName is required')
      })
    })

    describe('list() after add()', () => {
      it('returns added tasks', async () => {
        const agent = new Agent({ agentId: 'list-after-add' })
        await agent.scheduler.add({
          name: 'Task 1',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.list()
        expect(result.count).toBe(1)
        expect(result.tasks[0].name).toBe('Task 1')
      })
    })

    describe('update()', () => {
      it('updates task name', async () => {
        const agent = new Agent({ agentId: 'update-test' })
        const added = await agent.scheduler.add({
          name: 'Original',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.update(added.id, { name: 'Updated' })
        expect(result.name).toBe('Updated')
      })

      it('updates task enabled', async () => {
        const agent = new Agent({ agentId: 'update-enabled' })
        const added = await agent.scheduler.add({
          name: 'Test',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.update(added.id, { enabled: false })
        expect(result.enabled).toBe(false)
      })

      it('throws error for missing taskId', async () => {
        const agent = new Agent({ agentId: 'update-no-id' })
        await expect(agent.scheduler.update('', { name: 'Test' })).rejects.toThrow('taskId is required')
      })

      it('throws error for non-existent task', async () => {
        const agent = new Agent({ agentId: 'update-nonexist' })
        await expect(agent.scheduler.update('nonexistent', { name: 'Test' })).rejects.toThrow('Task not found')
      })
    })

    describe('remove()', () => {
      it('removes task', async () => {
        const agent = new Agent({ agentId: 'remove-test' })
        const added = await agent.scheduler.add({
          name: 'To remove',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.remove(added.id)
        expect(result.removed).toBe(true)

        const list = await agent.scheduler.list()
        expect(list.count).toBe(0)
      })

      it('throws error for missing taskId', async () => {
        const agent = new Agent({ agentId: 'remove-no-id' })
        await expect(agent.scheduler.remove('')).rejects.toThrow('taskId is required')
      })
    })

    describe('run()', () => {
      it('returns mock result', async () => {
        const agent = new Agent({ agentId: 'run-test' })
        const added = await agent.scheduler.add({
          name: 'To run',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.run(added.id)
        expect(result.ok).toBe(true)
        expect(result.ran).toBe(true)
      })
    })

    describe('runs()', () => {
      it('returns empty runs list', async () => {
        const agent = new Agent({ agentId: 'runs-test' })
        const added = await agent.scheduler.add({
          name: 'Test',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })
        const result = await agent.scheduler.runs(added.id)
        expect(result.taskId).toBe(added.id)
        expect(result.runs).toEqual([])
      })
    })

    describe('agentId isolation', () => {
      it('agents cannot see other agents tasks', async () => {
        const agent1 = new Agent({ agentId: 'agent-1' })
        const agent2 = new Agent({ agentId: 'agent-2' })

        await agent1.scheduler.add({
          name: 'Agent 1 task',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })

        const list1 = await agent1.scheduler.list()
        const list2 = await agent2.scheduler.list()

        expect(list1.count).toBe(1)
        expect(list2.count).toBe(0)
      })

      it('agents cannot update other agents tasks', async () => {
        const agent1 = new Agent({ agentId: 'agent-1' })
        const agent2 = new Agent({ agentId: 'agent-2' })

        const added = await agent1.scheduler.add({
          name: 'Agent 1 task',
          schedule: { kind: 'at' },
          payload: { kind: 'agentTurn', message: 'test' },
        })

        await expect(agent2.scheduler.update(added.id, { name: 'Hacked' })).rejects.toThrow('Task not found')
      })
    })
  })

  describe('throwIfAborted()', () => {
    it('throws when signal is aborted', () => {
      const controller = new AbortController()
      controller.abort()
      const agent = new Agent({ signal: controller.signal })
      expect(() => agent.throwIfAborted()).toThrow('Operation aborted')
    })

    it('does not throw when signal is not aborted', () => {
      const controller = new AbortController()
      const agent = new Agent({ signal: controller.signal })
      expect(() => agent.throwIfAborted()).not.toThrow()
    })
  })
})