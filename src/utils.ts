import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai'
import { contains_tokens } from 'tiktoken'
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)
const MAX_TOKENS = 8192

async function getNumberOfTokens (messages: ChatCompletionRequestMessage[]): Promise<number> {
  const tokens = []
  for (const message of messages) {
    for await (const token of contains_tokens(message.content)) {
      tokens.push(token)
    }
  }
  return tokens.length
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
