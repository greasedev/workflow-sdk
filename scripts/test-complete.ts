/**
 * Test script for complete() method in LOCAL mode.
 *
 * Usage:
 *   npx tsx scripts/test-complete.ts
 *
 * Requires .env file with OPENAI_API_KEY, OPENAI_BASE_URL (optional), LOCAL_MODEL (optional)
 */

import { config } from 'dotenv'
config()

// Import pi-ai first to initialize model registry and API providers
import '@mariozechner/pi-ai'

import { Agent } from '../src/agent.local.js'
import type { CompleteOptions } from '../src/types.js'

async function testTextCompletion() {
  console.log('\n=== Test 1: Text Completion ===')

  const agent = new Agent({ agentId: 'test-agent' })

  try {
    const result = await agent.complete('What is the capital of France? Answer in one sentence.')
    console.log('Result:', result)
    console.log('Text:', result.text)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function testTextWithSystem() {
  console.log('\n=== Test 2: Text with System Prompt ===')

  const agent = new Agent({ agentId: 'test-agent' })

  try {
    const result = await agent.complete('Analyze this: "The stock market crashed today."', {
      system: 'You are a financial news analyst. Be concise and professional.'
    })
    console.log('Result:', result)
    console.log('Text:', result.text)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function testJsonSchema() {
  console.log('\n=== Test 3: JSON Schema Output ===')

  const agent = new Agent({ agentId: 'test-agent' })

  const schema: CompleteOptions['jsonSchema'] = {
    type: 'object',
    properties: {
      sentiment: {
        type: 'string',
        enum: ['positive', 'negative', 'neutral'],
        description: 'The detected sentiment'
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence score from 0 to 1'
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of the sentiment judgment'
      }
    },
    required: ['sentiment', 'confidence']
  }

  try {
    const result = await agent.complete('Analyze the sentiment of: "I love this new phone! It works perfectly."', {
      system: 'You are a sentiment analyzer. Always use the output_structured tool.',
      jsonSchema: schema
    })
    console.log('Result:', result)
    console.log('JSON:', result.json)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function testJsonSchemaExtraction() {
  console.log('\n=== Test 4: JSON Schema - Data Extraction ===')

  const agent = new Agent({ agentId: 'test-agent' })

  const schema: CompleteOptions['jsonSchema'] = {
    type: 'object',
    properties: {
      contacts: {
        type: 'array',
        description: 'List of extracted contacts',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Contact name' },
            email: { type: 'string', format: 'email', description: 'Email address' }
          },
          required: ['name']
        }
      },
      summary: {
        type: 'string',
        description: 'Brief summary of the content'
      }
    },
    required: ['contacts', 'summary']
  }

  try {
    const result = await agent.complete('Extract contacts from this text: "John Doe (john@example.com) and Jane Smith work together at Acme Corp."', {
      system: 'You are a data extractor. Always use the output_structured tool.',
      jsonSchema: schema
    })
    console.log('Result:', result)
    console.log('JSON:', JSON.stringify(result.json, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function runTests() {
  console.log('Testing complete() method...\n')
  console.log('Make sure OPENAI_API_KEY is set in environment.')

  await testTextCompletion()
  await testTextWithSystem()
  await testJsonSchema()
  await testJsonSchemaExtraction()

  console.log('\n=== All tests completed ===')
}

runTests().catch(console.error)