import { ask, downloadFileAsBase64 } from './utils'

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

    const nonNullable = <T>(value: T): value is NonNullable<T> => value != null
    const model = 'gpt-4o'
    let max_tokens = null
    const threadMessages = await Promise.all(
      replies.messages.map(async (message) => {
        if (message.user !== botUserId && !message.text.includes(`<@${botUserId}>`)) {
          return null
        }

        const contents = []

        if (message.files) {
          for (const file of message.files) {
            if ('url_private_download' in file) {
              const encodedImage = await downloadFileAsBase64(file.url_private_download)
              let filetype = file.filetype
              if (filetype === 'jpg') {
                filetype = 'jpeg'
              }

              if (encodedImage) {
                max_tokens = 4096
                contents.push(
                  {
                    image_url: {
                      url: 'data:image/' + filetype + ';base64,' + encodedImage,
                      detail: 'auto'
                    },
                    type: 'image_url'
                  }
                )
              }
            }
          }
        }

        contents.push({ text: (message.text || '').replace(`<@${botUserId}>`, ''), type: 'text' })
        return {
          role: message.user === botUserId ? 'assistant' : 'user',
          content: contents
        }
      })
    )

    const gptAnswerText = await ask(threadMessages.filter(nonNullable), model, max_tokens)

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
