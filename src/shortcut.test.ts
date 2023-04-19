import { App } from '@slack/bolt'
import { shortcutQuery } from './shortcut'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'
import { WebClient } from '@slack/web-api'
import { ask } from './utils'

jest.mock('@slack/bolt')
jest.mock('./utils')

const mockAsk = ask as jest.MockedFunction<typeof ask>
describe('shortcutQuery', () => {
  let app: App
  let webClient: WebClient

  beforeEach(() => {
    app = new App({ token: 'dummyToken', signingSecret: 'dummySigningSecret' })
    webClient = new WebClient('dummyToken')
    app.client = webClient
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should send a message containing the query result', async () => {
    const inputText = 'について教えて'
    const expectedResult = 'テスト結果'
    const messageText = 'テスト'
    const chatPostMessageMock = jest.fn()

    webClient.chat.postMessage = chatPostMessageMock
    mockAsk.mockResolvedValue(expectedResult)

    const mockAck = jest.fn()
    const mockLogger = { info: jest.fn(), error: jest.fn() }

    const mockShortcut = {
      user: { id: 'U12345' },
      channel: { id: 'C12345' },
      message: { text: messageText, ts: '1234567890', attachments: [] }
    }

    await shortcutQuery(app)({
      // @ts-ignore
      shortcut: mockShortcut,
      // @ts-ignore
      logger: mockLogger,
      ack: mockAck
    })

    expect(mockAck).toHaveBeenCalled()
    expect(mockAsk).toHaveBeenCalledWith([
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: 'これから質問をします。わからないときはわからないと答えてください'
      },
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: messageText + inputText
      }
    ])

    expect(chatPostMessageMock).toHaveBeenCalledTimes(2)
    expect(chatPostMessageMock).toHaveBeenCalledWith({
      user: mockShortcut.user.id,
      channel: mockShortcut.channel.id,
      thread_ts: mockShortcut.message.ts,
      text: '結果',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '結果',
            emoji: true
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: expectedResult
            }
          ]
        }
      ]
    })
  })
})
