import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Agent } from '../src/agent'
import {
  CompletionError,
  ConnectionError,
} from '../src/errors'
import { CallError } from '../src/methods/call'
import { SchedulerError } from '../src/methods/schedule'

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn()

function mockResponse<T>(data: T, ok = true, status = 200) {
  return {
    ok,
    status,
    data,
  }
}

function mockErrorResponse(message: string, status: number) {
  return {
    ok: false,
    status,
    error: { message },
  }
}

describe('Agent', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: mockSendMessage,
      },
    })
    mockSendMessage.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('creates agent with no options', () => {
      const agent = new Agent({})
      expect(agent).toBeDefined()
      expect(agent.agentId).toBeDefined()
    })

    it('creates agent with browser context', () => {
      const agent = new Agent({
        browserContext: { windowId: 123 },
      })
      expect(agent).toBeDefined()
      expect(agent.browserContext?.windowId).toBe(123)
    })

    it('generates sessionId when stateful mode is enabled', () => {
      const agent = new Agent({ stateful: true })
      expect(agent.sessionId).not.toBeNull()
    })

    it('does not generate sessionId when stateful mode is disabled', () => {
      const agent = new Agent({ stateful: false })
      expect(agent.sessionId).toBeNull()
    })

    it('uses provided agentId', () => {
      const agent = new Agent({ agentId: 'test-agent-123' })
      expect(agent.agentId).toBe('test-agent-123')
    })

    it('generates agentId when not provided', () => {
      const agent = new Agent({})
      expect(agent.agentId).toMatch(/^[a-f0-9-]{36}$/) // UUID format
    })

    it('creates scheduler instance', () => {
      const agent = new Agent({})
      expect(agent.scheduler).toBeDefined()
    })
  })

  describe('getDb()', () => {
    it('returns Dexie instance with agentId in name', () => {
      const agent = new Agent({ agentId: 'test-agent' })
      const db = agent.getDb()
      expect(db.name).toBe('db-test-agent')
    })

    it('returns same instance on multiple calls', () => {
      const agent = new Agent({ agentId: 'test-agent' })
      const db1 = agent.getDb()
      const db2 = agent.getDb()
      expect(db1).toBe(db2)
    })
  })

  describe('getPageLink()', () => {
    it('generates basic page link', () => {
      const agent = new Agent({})
      const link = agent.getPageLink('index')
      expect(link).toBe('<pageLink>index.html</pageLink>')
    })

    it('generates page link with query params', () => {
      const agent = new Agent({})
      const link = agent.getPageLink('detail', { id: 123, tab: 'info' })
      expect(link).toBe('<pageLink>detail.html?id=123&tab=info</pageLink>')
    })

    it('generates page link with empty params', () => {
      const agent = new Agent({})
      const link = agent.getPageLink('home', {})
      expect(link).toBe('<pageLink>home.html</pageLink>')
    })
  })

  describe('complete()', () => {
    it('sends WORKFLOW_REQUEST message to background', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ text: 'Hello, world!' }))

      const agent = new Agent({})
      await agent.complete('Say hello')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/complete',
        body: expect.objectContaining({
          prompt: 'Say hello',
        }),
      })
    })

    it('includes system prompt option', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ text: 'Response' }))

      const agent = new Agent({})
      await agent.complete('Analyze this', {
        system: 'You are a helpful assistant',
      })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.system).toBe('You are a helpful assistant')
    })

    it('includes context option', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ text: 'Response' }))

      const agent = new Agent({})
      await agent.complete('Summarize', { context: { lang: 'en' } })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.context).toEqual({ lang: 'en' })
    })

    it('returns CompleteResult on success', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ text: 'Generated text response' }))

      const agent = new Agent({})
      const result = await agent.complete('Write a story')

      expect(result).toEqual({ text: 'Generated text response' })
    })

    it('throws CompletionError on failure', async () => {
      mockSendMessage.mockResolvedValue(mockErrorResponse('Completion failed', 500))

      const agent = new Agent({})

      await expect(agent.complete('Write something')).rejects.toThrow(
        CompletionError,
      )
    })

    it('throws ConnectionError when sendMessage throws', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'))

      const agent = new Agent({})

      await expect(agent.complete('Write something')).rejects.toThrow(
        ConnectionError,
      )
    })
  })

  describe('call()', () => {
    it('sends WORKFLOW_REQUEST message to background', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { id: 1, name: 'Test' } })

      const agent = new Agent({})
      await agent.call('/api/users')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/call',
        body: expect.objectContaining({
          targetEndpoint: '/api/users',
          method: 'GET',
        }),
      })
    })

    it('includes method option', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 201, data: { id: 1 } })

      const agent = new Agent({})
      await agent.call('/api/users', { method: 'POST' })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.method).toBe('POST')
    })

    it('includes headers option', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: {} })

      const agent = new Agent({})
      await agent.call('/api/users', { headers: { 'Authorization': 'Bearer token' } })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.headers).toEqual({ 'Authorization': 'Bearer token' })
    })

    it('includes body option', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 201, data: { id: 1 } })

      const agent = new Agent({})
      await agent.call('/api/users', { method: 'POST', body: { name: 'John' } })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.body).toEqual({ name: 'John' })
    })

    it('includes query option', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: [] })

      const agent = new Agent({})
      await agent.call('/api/users', { query: { page: 1, limit: 10 } })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.query).toEqual({ page: 1, limit: 10 })
    })

    it('returns CallResult on success', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: mockData })

      const agent = new Agent({})
      const result = await agent.call<{ id: number; name: string }>('/api/users/1')

      expect(result.data).toEqual(mockData)
      expect(result.status).toBe(200)
    })

    it('throws CallError on failure', async () => {
      mockSendMessage.mockResolvedValue({ ok: false, status: 404, error: { message: 'Not found' } })

      const agent = new Agent({})

      await expect(agent.call('/api/users/999')).rejects.toThrow(CallError)
    })

    it('throws ConnectionError on invalid response', async () => {
      mockSendMessage.mockResolvedValue(null)

      const agent = new Agent({})

      await expect(agent.call('/api/users')).rejects.toThrow(ConnectionError)
    })

    it('includes status code in CallError', async () => {
      mockSendMessage.mockResolvedValue({ ok: false, status: 500, error: { message: 'Server error' } })

      const agent = new Agent({})

      try {
        await agent.call('/api/users')
      } catch (error) {
        expect(error).toBeInstanceOf(CallError)
        expect((error as CallError).statusCode).toBe(500)
      }
    })
  })

  describe('scheduler', () => {
    it('scheduler.status() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { running: true, tasks: 0, nextWakeAtMs: null } })

      const agent = new Agent({})
      const result = await agent.scheduler.status()

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'status',
          agentId: agent.agentId,
        }),
      })
      expect(result.running).toBe(true)
    })

    it('scheduler.list() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { count: 0, tasks: [] } })

      const agent = new Agent({})
      const result = await agent.scheduler.list()

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'list',
          agentId: agent.agentId,
        }),
      })
      expect(result.count).toBe(0)
    })

    it('scheduler.add() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { id: 'task-1', name: 'Test', enabled: true, nextRunAtMs: 123 } })

      const agent = new Agent({})
      const result = await agent.scheduler.add({
        name: 'Test task',
        schedule: { kind: 'at', at: '2026-05-01T09:00:00Z' },
        payload: { kind: 'agentTurn', message: 'Hello' },
      })

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'add',
          agentId: agent.agentId,
          job: expect.objectContaining({
            name: 'Test task',
          }),
        }),
      })
      expect(result.id).toBe('task-1')
    })

    it('scheduler.update() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { id: 'task-1', name: 'Updated', enabled: false, nextRunAtMs: 123 } })

      const agent = new Agent({})
      const result = await agent.scheduler.update('task-1', { enabled: false })

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'update',
          taskId: 'task-1',
          patch: { enabled: false },
          agentId: agent.agentId,
        }),
      })
      expect(result.enabled).toBe(false)
    })

    it('scheduler.remove() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { ok: true, removed: true } })

      const agent = new Agent({})
      const result = await agent.scheduler.remove('task-1')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'remove',
          taskId: 'task-1',
          agentId: agent.agentId,
        }),
      })
      expect(result.removed).toBe(true)
    })

    it('scheduler.run() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { ok: true, ran: true } })

      const agent = new Agent({})
      const result = await agent.scheduler.run('task-1')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'run',
          taskId: 'task-1',
          agentId: agent.agentId,
        }),
      })
      expect(result.ran).toBe(true)
    })

    it('scheduler.runs() sends request', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { taskId: 'task-1', runs: [] } })

      const agent = new Agent({})
      const result = await agent.scheduler.runs('task-1')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/scheduler',
        body: expect.objectContaining({
          action: 'runs',
          taskId: 'task-1',
          agentId: agent.agentId,
        }),
      })
      expect(result.runs).toEqual([])
    })

    it('scheduler throws SchedulerError on failure', async () => {
      mockSendMessage.mockResolvedValue({ ok: false, status: 400, error: { message: 'Invalid job' } })

      const agent = new Agent({})

      await expect(agent.scheduler.add({
        name: '',
        schedule: { kind: 'at' },
        payload: { kind: 'agentTurn', message: '' },
      })).rejects.toThrow(SchedulerError)
    })
  })

  describe('dispose()', () => {
    it('sends WORKFLOW_REQUEST to clean up session', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true }))

      const agent = new Agent({})
      const sessionId = agent.sessionId

      await agent.dispose()

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/session/dispose',
        body: { sessionId },
      })
    })

    it('does not send message when stateful is false', async () => {
      const agent = new Agent({ stateful: false })
      await agent.dispose()

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('only disposes once', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true }))

      const agent = new Agent({})

      await agent.dispose()
      await agent.dispose()

      expect(mockSendMessage).toHaveBeenCalledTimes(1)
    })

    it('ignores dispose errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Dispose failed'))

      const agent = new Agent({})

      // Should not throw
      await expect(agent.dispose()).resolves.toBeUndefined()
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

  describe('sendText()', () => {
    it('sends WORKFLOW_REQUEST message to background', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { success: true } })

      const agent = new Agent({ agentId: 'test-agent' })
      await agent.sendText('chat-123', 'Title', 'Hello')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/send_text',
        body: expect.objectContaining({
          chatId: 'chat-123',
          title: 'Title',
          content: 'Hello',
          agentId: 'test-agent',
        }),
      })
    })
  })

  describe('sendImage()', () => {
    it('sends WORKFLOW_REQUEST message to background', async () => {
      mockSendMessage.mockResolvedValue({ ok: true, status: 200, data: { success: true } })

      const agent = new Agent({ agentId: 'test-agent' })
      await agent.sendImage('chat-123', 'data:image/png;base64,abc')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/send_image',
        body: expect.objectContaining({
          chatId: 'chat-123',
          base64Image: 'data:image/png;base64,abc',
          agentId: 'test-agent',
        }),
      })
    })
  })
})