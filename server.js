'use strict';
const env = require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;

console.log(env.parsed)

const config = {
  channelSecret: env.parsed.CHANNEL_SECRET,
  channelAccessToken: env.parsed.CHANNEL_ACCESS_TOKEN
};

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); 
app.post('/webhook', line.middleware(config), (req, res) => {
  console.log(req.body.events);

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

const handleEvent = async(event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text //実際に返信の言葉を入れる箇所
  });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);