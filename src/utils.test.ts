import { ChatCompletionRequestMessage, OpenAIApi } from 'openai'
import { ask } from './utils'

jest.mock('openai')

describe('ask function', () => {
  const messages: ChatCompletionRequestMessage[] = [
    { role: 'assistant', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ]

  beforeEach(() => {
    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockReset()
  })

  it('should return the correct response', async () => {
    const expectedResult = 'The capital of France is Paris.';

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValue({
      data: {
        choices: [{ message: { content: expectedResult } }]
      }
    })

    const result = await ask(messages)

    expect(result).toEqual(expectedResult)

    expect(OpenAIApi.prototype.createChatCompletion).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages
    })
  })
})
