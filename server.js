'use strict';
const env = require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

const config = {
  channelSecret: env.parsed.CHANNEL_SECRET,
  channelAccessToken: env.parsed.CHANNEL_ACCESS_TOKEN
};

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); 
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

const handleEvent = async ( event )=> {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if(event.message.text === 'ユーザー登録') {
    let replyText = '';
    replyText = '登録中。ちょっと待ってね'; //"ちょっと待ってね"ってメッセージだけ先に処理
    await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText
    });
    
    const profile = await client.getProfile(event.source.userId);

    const UserId = event.source.userId
    const USER_POST_URL = `http://localhost:8080/user/${UserId}`
    await axios.post(USER_POST_URL,{
      userName: profile.displayName, 
      introduction: profile.statusMessage, 
      twitter: "", 
      github: "", 
      image: profile.pictureUrl})
    return client.pushMessage(event.source.userId, {
        type: 'text',
        text: '登録しました。',
    });
  }

  const ISBN_BASE = "https://api.openbd.jp/v1/get?isbn="
  const ISBN_QUERY = event.message.text
  const isbnRes = await axios.get(ISBN_BASE+ISBN_QUERY)
    .then(res => {
      return res.data
    }).catch(() => {
      return [null]
    })
    
  if(isbnRes !== undefined && isbnRes !== null && isbnRes[0] !== null){
    let replyText = '';
    replyText = '投稿中。ちょっと待ってね'; //"ちょっと待ってね"ってメッセージだけ先に処理
    await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText
    });
    const bookName = isbnRes[0].summary.title;
    const BOOK_POST_URL = "http://localhost:8080/books/";
    const userName = event.source.userId
    await axios.post(BOOK_POST_URL+userName,{
        "isbn": ISBN_QUERY,
        "Article": "from LINE",
        "lend": false
    })
    return client.pushMessage(event.source.userId, {
        type: 'text',
        text: `${bookName}を投稿しました。`,
    });
  }
  return client.pushMessage(event.source.userId, {
    type: 'text',
    text: "ユーザー登録 : アカウントの登録するよー \n isbnコードを入力 : 所持している技術書を登録するよー",
});
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);