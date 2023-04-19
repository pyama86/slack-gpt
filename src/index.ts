import { app } from './app'
import { shortcutQuery } from './shortcut'
import { appMention } from './mention';

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000)
})()
app.shortcut({ callback_id: 'query', type: 'message_action' }, shortcutQuery(app))
app.event('app_mention', appMention)
