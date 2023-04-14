const { App,LogLevel } = require('@slack/bolt');
import * as dotenv from "dotenv";
import { ask } from '../shortcuts/question'
dotenv.config();

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
  customRoutes: [
    {
      path: '/health-check',
      method: ['GET'],
      handler: (req, res) => {
        res.writeHead(200);
        res.end('Health check information displayed here!');
      },
    },
  ],
});


app.event('app_mention', async ({ event, client, say }) => {
  const channelId = event.channel;
  const botUserId = process.env.BOT_USER_ID;
  try {
    const replies = await client.conversations.replies({
      channel: channelId,
      ts: event.thread_ts || event.ts,
    });

    if (!replies.messages) {
      await say(
        'スレッドが見つかりませんでした'
      );

      return;
    }

    const waitingMessage = "GPTに聞いています。しばらくお待ち下さい";
    await say({
      text: waitingMessage,
      thread_ts: event.ts,
    });

    const preContext = [{
      role: 'user',
      content: 'これから質問をします。わからないときはわからないと答えてください',
    }]


    const nonNullable = <T>(value: T): value is NonNullable<T> => value != null;
    const threadMessages = replies.messages.map((message) => {
      if (message.text.includes(waitingMessage)) {
        return;
      }

      return {
        role: message.user === botUserId ? 'assistant' : 'user',
        content: (message.text || '').replace(`<@${botUserId}>`, ''),
      };
    }).filter(nonNullable);


    const gptAnswerText = await ask(Object.assign(preContext, threadMessages));

    /* スレッドに返信 */
    await say({
      text: gptAnswerText,
      thread_ts: event.ts,
    });
  } catch (error) {
    console.error(error);
  }
});
