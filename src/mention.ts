import { ask } from './utils'

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

    const waitingMessage = 'GPTに聞いています。しばらくお待ち下さい。'
    await say({
      text: waitingMessage,
      thread_ts: event.ts
    })

    const preContext = [{
      role: 'user',
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
        role: message.user === botUserId ? 'assistant' : 'user',
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
    await say({
      text: 'なにかエラーが発生しました。開発者に連絡してください。error:' + error,
      thread_ts: event.ts
    })
  }
}
