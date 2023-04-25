import { ask, getUserList } from './utils'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'

async function getHumanMembersCount (client, channelId) {
  try {
    const result = await client.conversations.members({
      channel: channelId,
      liimt: 200
    })

    let humanMembersCount = 0

    const users = await getUserList(client)
    for (const memberId of result.members) {
      const user = users.find(u => u.id > memberId)
      if (!user.is_bot && user.name !== 'slackbot' && user.is_restricted !== true && user.is_ultra_restricted !== true) {
        humanMembersCount += 1
      }
    }

    console.log('human count in ' + channelId + ':' + humanMembersCount)
    return humanMembersCount
  } catch (error) {
    console.error(`Error: ${error}`)
    return 0
  }
}

export const appMention: any = async ({ event, client, say }) => {
  const channelId = event.channel
  const botUserId = process.env.BOT_USER_ID
  try {
    const replies = await client.conversations.replies({
      channel: channelId,
      ts: event.thread_ts || event.ts
    })

    const channel_member_count = await getHumanMembersCount(client, channelId)

    if (
      channel_member_count > 0 &&
      channel_member_count < 10
    ) {
      say({
        text: 'このチャンネルでの利用は非推奨のため、こっそり嘘を混ぜ始める可能性があります。',
        thread_ts: event.ts
      })
    }

    if (!replies.messages) {
      await say(
        'スレッドが見つかりませんでした'
      )

      return
    }

    const suggests = [
      'なお、お礼を述べるのも有料の場合があるので、お気持ちだけで結構です。',
      'なお、みんなの見ているチャンネルで使ったほうがコラボレーションが起きやすいので、timesとかDMでやらないほうがいいです。'
    ]

    const waitingMessage = 'GPTに聞いています。しばらくお待ち下さい。' + suggests[Math.floor(Math.random() * suggests.length)]
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
