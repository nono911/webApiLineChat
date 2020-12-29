const lineApiService = require('../services/line-api-service');

class LineMessaging {
	constructor() {
    }

    replyMessage(replyToken, message) {
        return new Promise(function (resolve, reject) {
            try {
                let _messages = [{
                    type: 'text',
                    text: message
                }];
                return lineApiService.reply(replyToken, _messages).then(function (rs) {
                    return resolve(rs);
                });
            }
            catch (e) {
                return reject(e);
            }
        });
    }
}
module.exports = new LineMessaging();
