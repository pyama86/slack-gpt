import { app } from '../bolt/bolt'

import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import * as dotenv from "dotenv";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function ask(messages: ChatCompletionRequestMessage[], model = "gpt-3.5-turbo-0301") {
  const response = await openai.createChatCompletion({
    model: model,
    messages: messages,
  });

  return response.data.choices[0].message?.content;
}

export default function() {
  app.shortcut('query', async ({ shortcut, ack, logger }) => {
    logger.info("query")
    ack();

    await app.client.chat.postMessage({
      user: shortcut.user.id,
      channel: shortcut.channel.id,
      thread_ts: shortcut.message.ts,
      "text": "聞いて見るから、ちょっとまってね"
    });


    logger.info(shortcut)
    let txt = shortcut.message.text;
    if (!txt) {
      if (shortcut.message.attachments[0]["text"]) {
        txt = shortcut.message.attachments[0]["text"]
      }  else {
        txt = shortcut.message.attachments[0]["title"]
      }
    }

    txt = txt + "について教えて"
    logger.info("query keyword:", txt)
    const result = await ask([
    {
        role: 'user',
        content: "これから質問をします。わからないときはわからないと答えてください",
    },
    {
        role: 'user',
        content: txt,
    }]);

    const blocks: any[] = [];

    blocks.push (
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "結果",
          "emoji": true
        },
      }
    )

    if(result.length == 0) {
      blocks.push(
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "エラーかも"
            }
          ]
        })
    } else {
      blocks.push(
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": result
            }
          ]
        })
    }

    try {
      const result = await app.client.chat.postMessage({
        user: shortcut.user.id,
        channel: shortcut.channel.id,
        thread_ts: shortcut.message.ts,
        "blocks": blocks,
        "text": "結果"
      });
      logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });
}
