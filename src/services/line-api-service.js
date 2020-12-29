const request = require('request');
const apiToken = 'QUot7X869EpNBeMS9h4qYjCjtiItuvF0qSc23vNCiEsorHCEn74zh1ZDMKtSlMKjWX8bpL1HlsTYB7reC+7u8oQKo3evZCsO+7T5/nrsDNiBQAQ3Xr7LEvGcmtbffKxdUZtHQpRYGbODCwLzhqplWQdB04t89/1O/w1cDnyilFU=';
const apiRoute = 'https://api.line.me/v2/bot/message/reply';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + apiToken
};

class LineAPIService {
	constructor() {}

//https://api.line.me/v2/bot/message/{message_id}/content -o image.png
    replyFlex(replyToken, messages) {
      return new Promise(function (resolve, reject) {
          try {
              messages = [JSON.parse(messages)];
              let body =  JSON.stringify({
                  replyToken : replyToken,
                  messages : messages
              })
              console.log("body "+body.toString());
          //  console.log("body "+body.toString().replace("\\\"",""));
          //  console.log("body "+body.toString().replace('"'," "));
              return request.post({
                  url: apiRoute,
                  headers: headers,
                  body: body
              }, (err, res, body) => {
                  console.log('status = ' + res.statusCode);
                  return resolve(res.statusCode);
              });
          }
          catch (e) {
              return reject(e);
          }
      });
    }

    reply(replyToken, messages) {
        return new Promise(function (resolve, reject) {
            try {
                let body = JSON.stringify({
                    replyToken: replyToken,
                    messages: messages
                })
                console.log("body "+body.toString());
                return request.post({
                    url: apiRoute,
                    headers: headers,
                    body: body
                }, (err, res, body) => {
                    console.log('status = ' + res.statusCode);
                    return resolve(res.statusCode);
                });
            }
            catch (e) {
                return reject(e);
            }
        });
    }
}
module.exports = new LineAPIService();
