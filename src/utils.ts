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

const GPT_MODEL = process.env.GPT_MODEL || 'gpt-4-turbo'

const GPT_MAX_TOKEN = Number(process.env.GPT_MAX_TOKEN || '128000')

async function getNumberOfTokens (messages: ChatCompletionUserMessageParam[]): Promise<number> {
  let length = 0
  const model = (process.env.TIKTOKEN_MODEL || 'gpt-4') as TiktokenModel

  const encoding = encoding_for_model(model)
  for (const message of messages) {
    if (message.role === 'user') {
      for (const content of message.content as any[]) {
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

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens
  })

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

export async function generateSummary (messages: ChatCompletionUserMessageParam[], model: string = GPT_MODEL, max_tokens: number | null = null) {
  const allMessages = messages
    .map(message => {
      if (typeof message.content === 'string') {
        return message.content
      } else {
        return message.content
          .map(content => {
            if ('text' in content) {
              return content.text
            } else {
              return ''
            }
          })
          .join('')
      }
    })
    .join('\n')

  const summaryPrompt = `
  次の内容を要約し、以下の要件を満たしたサマリを作成してください。

  1. 最初に箇条書き3行で全体の内容を要約して、3行まとめというヘッダを付けてください。その後に詳細な内容を記載してください。
  2. 納期やスケジュールについては明確に記載する
  3. 重要な内容については抜け漏れなく記載する
  4. あとから見た人がすぐに状況を把握できるようにする
  5. 最初に、「AIによるサマリ」と明記する

  ---スレッドの内容---
  ${allMessages}

  ---サマリ---
  `
  const summary = await ask([{ role: 'user', content: [{ type: 'text', text: summaryPrompt }] }], model, max_tokens)

  return summary
}
