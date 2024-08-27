import { OpenAI } from 'openai'
import { ask, generateSummary } from './utils'

jest.mock('openai', () => {
  const createMock = jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'Mocked response content'
        }
      }
    ]
  })

  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: createMock
        }
      }
    }))
  }
})

describe('generateSummary', () => {
  let openaiInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    openaiInstance = new OpenAI({ apiKey: 'dummy_api_key' })
  })

  it('should generate a summary from the given messages', async () => {
    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            text: 'This is the first message.',
            type: 'text' as const
          }
        ]
      },
      {
        role: 'user' as const,
        content: [
          {
            text: 'This is the second message.',
            type: 'text' as const
          }
        ]
      }
    ]

    const model = 'gpt-4o'
    const maxTokens: number = 4096

    const summary = await generateSummary(messages, model, maxTokens)

    expect(summary).toBe('Mocked response content')

    expect(openaiInstance.chat.completions.create).toHaveBeenCalledTimes(1)
    expect(openaiInstance.chat.completions.create).toHaveBeenCalledWith({
      model,
      messages: expect.any(Array),
      max_tokens: maxTokens
    })
  })

  it('should handle empty messages gracefully', async () => {
    const messages: any[] = []

    const model = 'gpt-4o'
    const maxTokens: number = 4096

    const summary = await generateSummary(messages, model, maxTokens)

    expect(summary).toBe('Mocked response content')

    expect(openaiInstance.chat.completions.create).toHaveBeenCalledTimes(1)
    expect(openaiInstance.chat.completions.create).toHaveBeenCalledWith({
      model,
      messages: expect.any(Array),
      max_tokens: maxTokens
    })
  })
})
