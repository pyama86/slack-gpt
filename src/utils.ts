import { OpenAI } from 'openai'
import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken'

import {
  ChatCompletionMessageParam
} from 'openai/resources/chat'
const apiKey = process.env.OPENAI_API_KEY as string
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set')
}
const openai = new OpenAI({ apiKey })

let MaxTokens = 8192
if (process.env.OPENAI_MAX_TOKENS !== '') {
  MaxTokens = parseInt(process.env.OPENAI_MAX_TOKENS, 10)
}
async function getNumberOfTokens (messages: ChatCompletionMessageParam[]): Promise<number> {
  let length = 0
  let model = 'gpt-4' as TiktokenModel
  if (process.env.OPENAI_MODEL !== '') {
    model = process.env.OPENAI_MODEL as TiktokenModel
  }

  const encoding = encoding_for_model(model)
  for (const message of messages) {
    if (message.role === 'user') {
      if (message.content instanceof String) {
        length += encoding.encode(message.content as string).length
      }
    }
  }
  encoding.free()
  return length
}

export async function ask (messages: ChatCompletionMessageParam[], model = 'gpt-4') {
  if (process.env.OPENAI_MODEL !== '') {
    model = process.env.OPENAI_MODEL as TiktokenModel
  }

  const response = await openai.chat.completions.create({
    model,
    messages
  })

  const numberOfTokens = await getNumberOfTokens(messages)

  if (numberOfTokens > MaxTokens) {
    return 'GPTの制限により、返答できませんでした。'
  }

  return response.choices[0].message?.content
}
