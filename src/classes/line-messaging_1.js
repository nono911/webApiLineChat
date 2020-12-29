const lineApiService = require('../services/line-api-service');
const firebaseService = require('../services/firebase-service');
var  rytoken ;
var  deviceID="" ;
class LineMessaging {
	constructor() {}

    	getImage(userID,replyToken,msgid)
		{
		  	firebaseService.getImagefromId(userID,replyToken,msgid);
		}

		replyFlexMessage(replyToken,message,userID) {
			return new Promise(function (resolve, reject) {
					try {
							let _messages = [{
								type: 'text',
								text: message
							}];
							if (message.toString().toLowerCase() =='notify')
							{

									//firebaseService.getoffListener();
								//	firebaseService.getonListener(userID,replyToken);
								firebaseService.getLastTrip(userID,replyToken);

							}
							if (message.toString().toLowerCase() =='car') {
								return firebaseService.getEnabledInsurance().then(function (rsHouses) {
										_messages[0]  = rsHouses;
										return lineApiService.replyFlex(replyToken, _messages).then(function (rs) {
										return resolve(rs);
									});
								});
							}
						}
						catch (e) {
								return reject(e);
						}
				}).catch((error) => {

				});
		}

    replyMessage(replyToken, message, userID) {
        return new Promise(function (resolve, reject) {
            try {
                let _messages = [{
                    type: 'text',
                    text: message
                }];
								/*
								if (message.toString().toLowerCase().substring(0,6) == 'report')
								{
									var day = "";
									if (message.toString().length > 6)
									{
										day = message.toString().substring(6,message.toString().length);
									}
									firebaseService.getReport(userID,day,replyToken);
								}
								*/
								if (message.toString().toLowerCase().substring(0,5)=="check")
								{
										firebaseService.getAllInfo(userID,replyToken);
								}
								if (message.toString().toLowerCase().substring(0,3) == "cid")
								{
									firebaseService.getoffListener(deviceID);
									firebaseService.getrunoffListener(deviceID);
									 if (message.toString().length >= 18) {

										deviceID = message.toString().substring(3, 18);
 									  console.log("cid ok ! " + deviceID + " " +userID);
									//  firebaseService.savecid(deviceID,userID,replyToken);

										return firebaseService.savecid(deviceID,userID,replyToken).then(function (callback) {
												_messages[0].text = callback;
												return lineApiService.reply(replyToken, _messages).then(function (rs) {
														return resolve(rs);
												});
										});
									//	firebaseService.getonListener(userID);
									 }
								}

								if (message.toString().toLowerCase().substring(0,6) == 'report')
								{
                  var day = "";
									if (message.toString().length > 6)
									{
										day = message.toString().substring(6,message.toString().length);
									}
								  firebaseService.getReport(userID,day,replyToken);
								}

								if (message.toString().toLowerCase() =='notify')
								{

							//		  firebaseService.getoffListener();
							//			firebaseService.getonListener(userID,replyToken);

								}
								if (message.toString().toLowerCase() == 'run')
								{

									  firebaseService.getrunoffListener();
										firebaseService.getonListenerRUN(userID);

								}
								if (message.toString().toLowerCase() == 'offnotify')
								{
								//		firebaseService.getoffListener(deviceID);
								}
								if (message.toString().toLowerCase() == 'offrun')
								{
										firebaseService.getrunoffListener();
								}
								if (message.toString().toLowerCase() == 'offall')
								{
									 firebaseService.getoffListener();
									 firebaseService.getrunoffListener();
								}

                if (message.toString().toLowerCase() =='car') {
                    return firebaseService.getEnabledInsurance().then(function (rsHouses) {
                        _messages[0].text = rsHouses;
                        return lineApiService.reply(replyToken, _messages).then(function (rs) {
                            return resolve(rs);
                        });
                    });
                }
                else {
                    //return lineApiService.reply(replyToken, _messages).then(function (rs) {
                    //    return resolve(rs);
                    //});
                }
            }
            catch (e) {
                return reject(e);
            }
				}).catch((error) => {

        });
    }

}
module.exports = new LineMessaging();
