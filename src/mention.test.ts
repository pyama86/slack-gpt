import { appMention } from './mention'

// モック関数
const mockSay = jest.fn()
const mockClient = {
  conversations: {
    replies: jest.fn(),
    members: jest.fn(),
    info: jest.fn()
  }
}

const mockEvent = {
  channel: 'test_channel',
  thread_ts: 'test_thread_ts',
  ts: 'test_ts'
}

const mockAsk = jest.fn()

jest.mock('./utils', () => ({
  ask: () => mockAsk()
}))

describe('appMention', () => {
  beforeEach(() => {
    mockClient.conversations.replies.mockClear()
    mockSay.mockClear()
    mockAsk.mockClear()
  })

  it('should handle app mention event', async () => {
    mockClient.conversations.replies.mockResolvedValueOnce({
      messages: [
        {
          text: 'test message',
          user: 'test_user'
        }
      ]
    })
    mockAsk.mockResolvedValueOnce('GPTの回答')

    const args = {
      event: mockEvent as any,
      client: mockClient as any,
      say: mockSay
    }

    await appMention(args)

    expect(mockClient.conversations.replies).toHaveBeenCalledWith({
      channel: 'test_channel',
      ts: 'test_thread_ts'
    })

    expect(mockSay).toHaveBeenCalledTimes(1)
    expect(mockSay).toHaveBeenNthCalledWith(1, {
      text: 'GPTの回答',
      thread_ts: 'test_ts'
    })
  })

  // 他のテストケースを追加してください
})
