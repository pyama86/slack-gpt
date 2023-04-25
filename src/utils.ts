import { Configuration, OpenAIApi, ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai'
import { encoding_for_model } from '@dqbd/tiktoken'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)
const MAX_TOKENS = 8192
async function getNumberOfTokens (messages: ChatCompletionRequestMessage[]): Promise<number> {
  let length = 0
  const encoding = encoding_for_model('gpt-4')
  for (const message of messages) {
    if (message.role === ChatCompletionRequestMessageRoleEnum.User) {
      length += encoding.encode(message.content).length
    }
  }
  encoding.free()
  return length
}

export async function ask (messages: ChatCompletionRequestMessage[], model = 'gpt-4') {
  const response = await openai.createChatCompletion({
    model,
    messages
  })

  const numberOfTokens = await getNumberOfTokens(messages)

  if (numberOfTokens > MAX_TOKENS) {
    return 'GPT-4の制限により、返答できませんでした。'
  }

  return response.data.choices[0].message?.content
}

const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 3600 })

export async function getUserList (client) {
  const userList = cache.get('userList')
  if (userList) {
    return userList
  }

  let allUsers = []
  let cursor = 0

  try {
    while (true) {
      const result = await client.users.list({
        limit: 1000,
        cursor
      })

      allUsers = allUsers.concat(result.members)
      if (result.response_metadata.next_cursor) {
        cursor = result.response_metadata.next_cursor
      } else {
        break
      }
    }
  } catch (error) {
    console.error(`Error: ${error}`)
    return null
  }
  cache.set('userList', allUsers)
  return allUsers
}
