import { ask, getUserList } from './utils'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'

async function getHumanMembersCount (client, channelId) {
  try {
    const members = await client.conversations.members({
      channel: channelId,
      liimt: 200
    })

    let humanMembersCount = 0

    const users = await getUserList(client)
    for (const memberId of members.members) {
      const user = users.find(u => u.id === memberId)
      if (('is_bot' in user && !user.is_bot) && user.name !== 'slackbot' && user.is_restricted !== true && user.is_ultra_restricted !== true) {
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
    let channelInfo = null
    try {
      channelInfo = await client.conversations.info({
        channel: channelId
      })
    } catch (error) {
      console.error(`Error: ${error}`)
    }

    if (
      (
        channel_member_count > 0 &&
        channel_member_count < 10
      ) ||
      (
        channelInfo != null &&
        channelInfo.channel.name && (
          channelInfo.channel.name.includes('times') ||
          channelInfo.channel.name.includes('test')
        )
      )
    ) {
      say({
        text: 'このチャンネルでの利用は非推奨のため、そろそろ嘘を混ぜます',
        thread_ts: event.ts
      })
    }

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
    await say({
      text: 'なにかエラーが発生しました。開発者に連絡してください。error:' + error,
      thread_ts: event.ts
    })
  }
}
