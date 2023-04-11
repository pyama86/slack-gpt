## Slack-GPT

SlackショートカットもしくはメンションからGPT4のAPIを呼び出し、応答するSlackボットです。メンションして話しかけ続けることでコンテキストを保ったやり取りが可能です。

## Deploy

1. app manifestをSlackにDeployする。(manifest.json)その際に、example.comとなっている箇所はURLを書き換えてください。
2. アプリをk8sなどで実行する。exampleディレクトリにサンプルマニフェストがあります。ingressはよしなにやってください。
3. secretの登録

```bash
$ kubectl create secret generic -n default slack-gpt \
--from-literal=slack-bot-token=xxx \
--from-literal=slack-signing-secret=xxx \
--from-literal=openai-secret=xxx
```
## Author
- pyama86
