
import { app } from './bolt/bolt'
import question from './shortcuts/question'

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);
})();
question();
