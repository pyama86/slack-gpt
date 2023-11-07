import { ask } from './utils'

export function shortcutQuery (app) {
  return async ({
    shortcut,
    ack,
    logger
  }) => {
    ack()
    await app.client.chat.postMessage({
      user: shortcut.user.id,
      channel: shortcut.channel.id,
      thread_ts: shortcut.message.ts,
      text: '聞いて見るから、ちょっとまってね'
    })

    logger.info(shortcut)
    let txt = shortcut.message.text
    if (!txt) {
      if (shortcut.message.attachments[0].text) {
        txt = shortcut.message.attachments[0].text
      } else {
        txt = shortcut.message.attachments[0].title
      }
    }

    txt = txt + 'について教えて'
    logger.info('query keyword:', txt)
    const result = await ask([
      {
        role: 'user',
        content: 'これから質問をします。わからないときはわからないと答えてください'
      },
      {
        role: 'user',
        content: txt
      }])

    const blocks: any[] = []

    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '結果',
          emoji: true
        }
      }
    )

    if (result.length === 0) {
      blocks.push(
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'エラーかも'
            }
          ]
        })
    } else {
      blocks.push(
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: result
            }
          ]
        })
    }

    try {
      const result = await app.client.chat.postMessage({
        user: shortcut.user.id,
        channel: shortcut.channel.id,
        thread_ts: shortcut.message.ts,
        blocks,
        text: '結果'
      })
      logger.info(result)
    } catch (error) {
      logger.error(error)
    }
  }
};
