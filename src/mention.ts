import { ask, downloadFileAsBase64, generateSummary } from './utils'

export const appMention: any = async ({ event, client, say }) => {
  const channelId = event.channel
  const botUserId = process.env.BOT_USER_ID
  try {
    const replies = await client.conversations.replies({
      channel: channelId,
      ts: event.thread_ts || event.ts
    })

    if (!replies.messages) {
      await say('スレッドが見つかりませんでした')
      return
    }

    const nonNullable = <T>(value: T): value is NonNullable<T> => value != null
    let model = process.env.GPT_MODEL || 'gpt-4o'
    let max_tokens = null

    const isSummaryRequest = event.text.includes('今北産業')

    const aiInstructionMessage = {
      role: 'system',
      content: [
        { text: '応答はマークダウンで行ってください。', type: 'text' }
      ]
    }

    const threadMessages = [
      aiInstructionMessage,
      ...(await Promise.all(
        replies.messages.map(async (message) => {
          if (
            (!isSummaryRequest && message.user !== botUserId && !message.text.includes(`<@${botUserId}>`)) ||
              (isSummaryRequest && message.text.includes('今北産業'))
          ) {
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
                  model = process.env.IMAGE_MODEL || 'gpt-4o'
                  max_tokens = 4096
                  contents.push({
                    image_url: {
                      url: 'data:image/' + filetype + ';base64,' + encodedImage,
                      detail: 'auto'
                    },
                    type: 'image_url'
                  })
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
      ))
    ]

    let answer = ''
    if (isSummaryRequest) {
      answer = await generateSummary(threadMessages.filter(nonNullable), model, max_tokens)
    } else {
      answer = await ask(threadMessages.filter(nonNullable), model, max_tokens)
    }

    await say({
      thread_ts: event.ts,
      text: answer,
      type: 'mrkdwn'
    })
  } catch (error) {
    console.error(error)
    await say({
      text: 'なにかエラーが発生しました。開発者に連絡してください。error:' + error,
      thread_ts: event.ts
    })
  }
}
