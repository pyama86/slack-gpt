import { appMention } from './mention'

import { ask, generateSummary } from './utils'

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
  ts: 'test_ts',
  text: 'test_message'
}

jest.mock('./utils', () => {
  return {
    ask: jest.fn(),
    generateSummary: jest.fn()
  }
})

describe('appMention', () => {
  beforeEach(() => {
    mockClient.conversations.replies.mockClear()
    mockSay.mockClear()
    ;(ask as jest.Mock).mockClear()
    ;(generateSummary as jest.Mock).mockClear()
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
    ;(ask as jest.Mock).mockResolvedValueOnce('GPTの回答')

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
      type: 'mrkdwn',
      text: 'GPTの回答',
      thread_ts: 'test_ts'
    })
  })

  it('should handle app mention event with 今北産業', async () => {
    const eventWithSummaryRequest = {
      ...mockEvent,
      text: '今北産業'
    }

    mockClient.conversations.replies.mockResolvedValueOnce({
      messages: [
        {
          text: 'test message 1',
          user: 'test_user_1'
        },
        {
          text: 'test message 2',
          user: 'test_user_2'
        }
      ]
    })
    ;(generateSummary as jest.Mock).mockResolvedValueOnce('サマリの内容')

    const args = {
      event: eventWithSummaryRequest as any,
      client: mockClient as any,
      say: mockSay
    }

    await appMention(args)

    expect(mockClient.conversations.replies).toHaveBeenCalledWith({
      channel: 'test_channel',
      ts: 'test_thread_ts'
    })

    expect(generateSummary).toHaveBeenCalledWith(
      [
        {
          role: 'system',
          content: [{ text: '応答はマークダウンで行ってください。', type: 'text' }]
        },
        {
          role: 'user',
          content: [{ text: 'test message 1', type: 'text' }]
        },
        {
          role: 'user',
          content: [{ text: 'test message 2', type: 'text' }]
        }
      ],
      'gpt-4o',
      null
    )

    expect(mockSay).toHaveBeenCalledTimes(1)
    expect(mockSay).toHaveBeenNthCalledWith(1, {
      type: 'mrkdwn',
      text: 'サマリの内容',
      thread_ts: 'test_ts'
    })
  })
})
