import { ask } from './utils'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'

export const appMention: any = async ({ event, client, say }) => {
  const channelId = event.channel
  const botUserId = process.env.BOT_USER_ID
  try {
    const replies = await client.conversations.replies({
      channel: channelId,
      ts: event.thread_ts || event.ts
    })

    if (!replies.messages) {
      await say(
        'スレッドが見つかりませんでした'
      )

      return
    }

    const waitingMessage = 'GPTに聞いています。しばらくお待ち下さい。なお、お礼を述べるのも有料の場合があるので、お気持ちだけで結構です。'
    await say({
      text: waitingMessage,
      thread_ts: event.ts
    })

    const preContext = [{
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: 'これから質問をします。わからないときはわからないと答えてください。業務と関係なさそうであれば、解答の最後に、「この質問は業務と関係ないかもしれません」と追記してください。'
    }]

    const nonNullable = <T>(value: T): value is NonNullable<T> => value != null
    const threadMessages = replies.messages.map((message) => {
      if (message.text.includes(waitingMessage)) {
        return null
      }

      if (message.user !== botUserId && !message.text.includes(`<@${botUserId}>`)) {
        return null
      }

      return {
        role: message.user === botUserId ? ChatCompletionRequestMessageRoleEnum.Assistant : ChatCompletionRequestMessageRoleEnum.User,
        content: (message.text || '').replace(`<@${botUserId}>`, '')
      }
    }).filter(nonNullable)

    const gptAnswerText = await ask(Object.assign(preContext, threadMessages))

    /* スレッドに返信 */
    await say({
      text: gptAnswerText,
      thread_ts: event.ts
    })
  } catch (error) {
    console.error(error)
  }
}
