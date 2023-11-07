import { OpenAI } from 'openai'
import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken'
import axios from 'axios'
import {
  ChatCompletionUserMessageParam
} from 'openai/resources/chat'
const apiKey = process.env.OPENAI_API_KEY as string
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set')
}
const openai = new OpenAI({ apiKey })

const GPT_MODEL = 'gpt-4-1106-preview'

const GPT_MAX_TOKEN = 128000

async function getNumberOfTokens (messages: ChatCompletionUserMessageParam[]): Promise<number> {
  let length = 0
  const model = 'gpt-4' as TiktokenModel

  const encoding = encoding_for_model(model)
  for (const message of messages) {
    if (message.role === 'user') {
      for (const content of message.content as any[]) {
        console.log(content.text)
        if (content.type === 'text') {
          length += encoding.encode(content.text).length
        } else if (content.type === 'image_url') {
          length += 4096
        }
      }
    }
  }
  encoding.free()
  return length
}

export async function ask (messages: ChatCompletionUserMessageParam[], model: string = GPT_MODEL, max_tokens: number | null = null) {
  const numberOfTokens = await getNumberOfTokens(messages)

  if (numberOfTokens > GPT_MAX_TOKEN) {
    return 'GPTの制限により、返答できませんでした。'
  }

  console.log(model)
  console.log('numberOfTokens', numberOfTokens)
  console.dir(messages, { depth: null })

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens
  })
  console.dir(response)
  console.dir(response, { depth: null })

  return response.choices[0].message?.content
}

export async function downloadFileAsBase64 (url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
    })

    const data: string = Buffer.from(response.data, 'binary').toString('base64')
    return data
  } catch (error) {
    console.error('Error downloading file:', error)
    return null
  }
}
