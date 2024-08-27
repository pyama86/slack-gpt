import { app } from './app'
import { appMention } from './mention';

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000)
})()
app.event('app_mention', appMention)
