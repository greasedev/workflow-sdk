import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Agent } from '../src/agent'
import {
  ActionError,
  CompletionError,
  ConnectionError,
} from '../src/errors'
import { CallError } from '../src/methods/call'

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
    })

    it('creates agent with browser context', () => {
      const agent = new Agent({
        browserContext: { windowId: 123 },
      })
      expect(agent).toBeDefined()
    })

    it('generates sessionId when stateful mode is enabled', () => {
      const agent = new Agent({ stateful: true })
      expect(agent.sessionId).not.toBeNull()
    })

    it('does not generate sessionId when stateful mode is disabled', () => {
      const agent = new Agent({ stateful: false })
      expect(agent.sessionId).toBeNull()
    })
  })

  describe('act()', () => {
    it('sends WORKFLOW_REQUEST message to background', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      await agent.act('click the button')

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/act',
        body: expect.objectContaining({
          instruction: 'click the button',
        }),
      })
    })

    it('includes context and maxSteps options', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      await agent.act('search for item', {
        context: { query: 'headphones' },
        maxSteps: 5,
      })

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.instruction).toBe('search for item')
      expect(call.body.context).toEqual({ query: 'headphones' })
      expect(call.body.maxSteps).toBe(5)
    })

    it('includes browserContext from agent', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({
        browserContext: { windowId: 123, enabledMcpServers: ['test'] },
      })
      await agent.act('click the button')

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.browserContext).toEqual({
        windowId: 123,
        enabledMcpServers: ['test'],
      })
    })

    it('includes sessionId in request', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      const sessionId = agent.sessionId
      await agent.act('click the button')

      const call = mockSendMessage.mock.calls[0][0]
      expect(call.body.sessionId).toBe(sessionId)
    })

    it('returns ActResult on success', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      const result = await agent.act('click the button')

      // After loop completes without verification, returns failure
      // because the loop continues when success is true but exits with failure
      expect(result.success).toBe(false)
      expect(result.steps).toEqual([])
    })

    it('returns ActResult with steps', async () => {
      const mockSteps = [
        { thought: 'I need to click the button', toolCalls: [{ name: 'click', args: { x: 100, y: 200 } }] },
      ]
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: mockSteps }))

      const agent = new Agent({})
      const result = await agent.act('click the button')

      expect(result.success).toBe(false)
      expect(result.steps).toEqual(mockSteps)
    })

    it('throws ActionError on failure', async () => {
      mockSendMessage.mockResolvedValue(mockErrorResponse('Action failed', 500))

      const agent = new Agent({})

      await expect(agent.act('click the button')).rejects.toThrow(ActionError)
    })

    it('throws ConnectionError when sendMessage throws', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'))

      const agent = new Agent({})

      await expect(agent.act('click the button')).rejects.toThrow(
        ConnectionError,
      )
    })

    it('resets sessionId when resetState is true', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      const originalSessionId = agent.sessionId

      await agent.act('click the button', { resetState: true })

      expect(agent.sessionId).not.toBe(originalSessionId)
    })

    it('does not reset sessionId when resetState is false', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      const originalSessionId = agent.sessionId

      await agent.act('click the button', { resetState: false })

      expect(agent.sessionId).toBe(originalSessionId)
    })

    it('returns failure immediately when action fails', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: false, steps: [] }))

      const agent = new Agent({})
      const result = await agent.act('click the button')

      expect(result.success).toBe(false)
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
    })

    it('executes all retries when maxRetries is set', async () => {
      mockSendMessage.mockResolvedValue(mockResponse({ success: true, steps: [] }))

      const agent = new Agent({})
      const result = await agent.act('click the button', { maxRetries: 1 })

      // Loop runs 2 times (initial + 1 retry) since success=true doesn't return early
      expect(mockSendMessage).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(false) // Loop ends with failure
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

  describe('error handling', () => {
    it('includes status code in error', async () => {
      mockSendMessage.mockResolvedValue(mockErrorResponse('Not found', 404))

      const agent = new Agent({})

      try {
        await agent.act('click the button')
      } catch (error) {
        expect(error).toBeInstanceOf(ActionError)
        expect((error as ActionError).statusCode).toBe(404)
      }
    })

    it('extracts error message from response', async () => {
      mockSendMessage.mockResolvedValue(mockErrorResponse('Custom error message', 400))

      const agent = new Agent({})

      try {
        await agent.act('click the button')
      } catch (error) {
        expect(error).toBeInstanceOf(ActionError)
        expect((error as ActionError).message).toBe('Custom error message')
      }
    })

    it('uses default error message when no error message', async () => {
      mockSendMessage.mockResolvedValue({ ok: false, status: 500 })

      const agent = new Agent({})

      try {
        await agent.act('click the button')
      } catch (error) {
        expect(error).toBeInstanceOf(ActionError)
        expect((error as ActionError).message).toBe(
          'Request failed with status 500',
        )
      }
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
})