/* eslint-disable no-empty */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
// messages module
const { admin } = require('../config/firebase');
const { Events } = require('../events/index');

const queryString = require('query-string');
const moment = require('moment');
const uuidv1 = require('uuid/v1');
const serviceAccount = require('../../serviceAccountKey.json');

const access_token = 'QUot7X869EpNBeMS9h4qYjCjtiItuvF0qSc23vNCiEsorHCEn74zh1ZDMKtSlMKjWX8bpL1HlsTYB7reC+7u8oQKo3evZCsO+7T5/nrsDNiBQAQ3Xr7LEvGcmtbffKxdUZtHQpRYGbODCwLzhqplWQdB04t89/1O/w1cDnyilFU='
const secret = '1fc1633a34a35c0cee89e6f18934438f'

class MessageToFirebase {
    constructor() {
        
    }

    async firebaseSession(req, res) {
        let body = req.body;
        let checkRevoked = true;
        try {
            const sucess = await admin.auth().verifyIdToken(body.token,checkRevoked)
            console.log(sucess)
            return res.status(200).send({
                "status": "success",
                "message": "token is valid"
            });
        } catch(error) {
            if (error.code == 'auth/id-token-revoked') {
                console.log('Token has been revoked. Inform the user to reauthenticate or signOut() the user.')
            } else {
                console.log('Token is invalid.')
            }
            return res.status(400).send({
                error: "token expire"
            }); 
        }
    }
    async revokeFirebaseToken(req, res) {
        let body = req.body;
        var user = undefined;
        try {
            user = await admin.auth().getUserByEmail(body.email).catch((e) => { throw `error fetching user` })
        } catch(error) {
            console.log(error);
        }

        if (user == undefined) {
            return res.status(401).send({
                error: "User not found"
            }); 
        }
        let uid = user.uid
        const revoke = await admin.auth().revokeRefreshTokens(user.uid)
        return res.status(200).send({
            'status':'success',
            'message':'Revoke token success'
        });
    }
    async sendMessage(req, res) {
        let hrstart;
        let hrend;

        hrstart = process.hrtime();
        
        console.info({ "function": "/messages/send", "data": { "message": "start" } });
        console.log({ "function": "/messages/send", "data": { "request": { query: JSON.stringify(req.query), body: JSON.stringify(req.body) } } });
        let body = req.body;

        let channelId = req.query.id ? req.query.id : null;
        let roomId = req.query.room_id ? req.query.room_id : null;
        let source = req.query.source ? req.query.source : null;
        let userId = req.query.user_id ? req.query.user_id : null;
        let provider_room_id = req.query.provider_room_id ? req.query.provider_room_id : null;
        let userName = req.query.user_name ? req.query.user_name : null;

        const db = admin.firestore();
        const channelRef = db.collection('channels');
        const roomRef = db.collection('rooms');
        const packageRef = db.collection('packages');
        const stickerRef = db.collection('stickers');

        let channel = null;
        let room = null;
        var objMessage = {};
        hrend = process.hrtime(hrstart);

        console.info('(0.1) Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)    
        const line = require('@line/bot-sdk');
        if (!Array.isArray(body)){ body = [body]; }
        console.log({ "function": "/messages/send", "data": { "body": JSON.stringify(body) } });
        let messageDatas = [];
        let messagePayloads = [];
        let messageIds = [];
        let date = new Date().getTime();
        let roomData = {
            updated_at: date,
            timestamp: date
        };
        for (let item in body) {
            let messageObject = body[item];
            let messageType = messageObject.type;
            let textMsg = messageObject.text;
            let stickerMsg = messageObject.sticker_id;
            let stickerPackage = messageObject.package_id;
            let imageMsg = messageObject.image_url;
            let videoMsg = messageObject.video_url;
            let previewImageMsg = messageObject.preview_image_url;
            let clientMessageId = messageObject.client_message_id ? messageObject.client_message_id : null;
            let flexMsg = messageObject.contents;
            let templateMsg = messageObject.template;

            let messageId;
            let messageData;
            let messagePayload;

            let date = new Date().getTime();


            if (messageType === "text") {
                //parse text message
                // try {
                //     textMsg = await Markdown.parse(textMsg, {roomId: roomId});
                // } catch (error) {
                //     console.error({ "function": "/messages/send", "data": { "message": 'Parse text message error', "error": JSON.stringify(error) } });
                //     return res.status(400).send({ error: error.toString() });
                // }
                
                messageData = {
                    message: textMsg,
                    client_message_id: clientMessageId,
                    provider_message_id: null,
                    user_id: userId,
                    user_name: userName,
                    direction: "send",
                    type: "text",
                    status: "pending",
                    created_at: date,
                    updated_at: date
                };
                messagePayload = {
                    type: "text",
                    text: textMsg
                };
            } else if (messageType === "image") {
                messageData = {
                    image_url: imageMsg,
                    client_message_id: clientMessageId,
                    provider_message_id: null,
                    user_id: userId,
                    user_name: userName,
                    direction: "send",
                    type: "image",
                    status: "pending",
                    created_at: date,
                    updated_at: date
                };

                messagePayload = {
                    type: "image",
                    originalContentUrl: imageMsg,
                    previewImageUrl: previewImageMsg
                };
            } else if (messageType === "video") {
                messageData = {
                    video_url: videoMsg,
                    client_message_id: clientMessageId,
                    provider_message_id: null,
                    user_id: userId,
                    direction: "send",
                    type: "video",
                    status: "pending",
                    created_at: date,
                    updated_at: date
                };

                messagePayload = {
                    type: "video",
                    originalContentUrl: videoMsg,
                    previewImageUrl: previewImageMsg
                };
            } else if (messageType === "flex") {
                messageData = {
                    contents: flexMsg,
                    provider_message_id: null,
                    direction: "send",
                    type: "flex",
                    status: "pending",
                    created_at: date,
                    updated_at: date
                };
                messagePayload = {
                    type: "flex",
                    altText: "This is a Flex Message",
                    contents: flexMsg
                };
            } else if (messageType === "template") {
                messageData = {
                    template: templateMsg,
                    provider_message_id: null,
                    direction: "send",
                    type: "template",
                    status: "pending",
                    created_at: date,
                    updated_at: date
                };
                messagePayload = {
                    type: "template",
                    altText: "This is a template",
                    template: templateMsg
                };
            } else if (messageType === "sticker") {
                let providerPackageId = null;
                let providerStickerId = null;
                let stickerImage = null;
                
                //find provider package id
                // let packages = await packageRef.doc(stickerPackage).get();
                // if (packages.exists) {
                //     providerPackageId = packages.data().provider_package_id;
                // } else {
                //     console.error({ "function": "/messages/send", "data": { "message": "Package not found", "packageId": stickerPackage } });
                //     return res.status(400).send('Package not found.');
                // }



                //find provider sticker id
                if (stickerPackage !== 'undefine' && stickerMsg !== 'undefine' && imageMsg !== 'undefine') {
                    providerPackageId = stickerPackage
                    stickerImage = imageMsg
                    providerStickerId =  stickerMsg
                } else {
                    console.error({ "function": "/messages/send", "data": { "message": "Sticker not found", "stickerId": stickerMsg } });
                    return res.status(400).send('Sticker not found.');
                }

                messageData = {
                    sticker_id: stickerMsg,
                    package_id: stickerPackage,
                    image_url: stickerImage,
                    provider_message_id: null,
                    direction: "send",
                    type: "sticker",
                    status: "pending",
                    created_at: date,
                    updated_at: date,
                    user_id: userId,
                    user_name: userName
                };
                messagePayload = {
                    type: "sticker",
                    packageId: providerPackageId,
                    stickerId: providerStickerId
                };
            }
            if (source){ messageData.source = source; }
            await roomRef.doc(roomId).set(roomData, { merge: true });
            let message = await roomRef.doc(roomId).collection('messages').add(messageData);
            messageDatas.push(messageData);
            messagePayloads.push(messagePayload);
            messageIds.push(message.id);
            objMessage = messageData;
        }
        hrend = process.hrtime(hrstart);
        console.info('(1) Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
        console.log({ "function": "/messages/send", "data": { "messagePayloads": JSON.stringify(messagePayloads) } });

        hrstart = process.hrtime();
        let client
        try {
            client = new line.Client({
                channelAccessToken: access_token,
                channelSecret: secret
            });
        } catch (error) {
            console.error({ "function": "/messages/send", "data": { "message": 'Get line client error', "error": JSON.stringify(error) } });

            //save error 
            for (let item in messageIds) {
                let date = new Date().getTime();
                let messageId = messageIds[item];
                let messageData = {
                    status: "fail",
                    error: JSON.stringify(error),
                    updated_at: date
                };
                roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true });
            }

            return res.status(500).send({
                message_ids: messageIds,
                error: error.toString()
            });
        }

        console.log({"function": "/messages/send", "data": { "provider_room_id": provider_room_id }});

        client.pushMessage(provider_room_id, messagePayloads)
            .then((response) => {
                hrend = process.hrtime(hrstart);
                console.info('(2) Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
                console.log({"function": "/messages/send", "data": { "response": response }});
                for (let item in messageIds) {
                    hrstart = process.hrtime();

                    let date = new Date().getTime();
                    let messageId = messageIds[item];
                    let messageData = {
                        provider_message_id: null,
                        status: "delivery",
                        error: "",
                        updated_at: date
                    };
                
                    roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true }).then(()=>{
                        hrend = process.hrtime(hrstart);
                        console.info('(3) Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
                        Events.updateRecentMessages(objMessage,roomId,"send","")
                    });
                }
            })
            .catch((err) => {
                for (let item in messageIds) {
                    let date = new Date().getTime();
                    let messageId = messageIds[item];
                    let messageData = {
                        status: "fail",
                        error: JSON.stringify(err),
                        updated_at: date
                    };
                    roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true });
                }
                console.error({ "function": "/messages/send", "data": { "message": 'Error Send Message', "error": JSON.stringify(err) } });
            });
        if (messageIds.length <= 1){
            return res.status(200).send({
                message_id: messageIds[0]
            }); 
        }
        return res.status(200).send({
            message_ids: messageIds
        }); 
    }
    async messageApi(req, res) {
    // messageapi: async (req, res) =>   {
        let requestId = uuidv1();
        const db = admin.firestore();
        const channelRef = db.collection('channels');
        const roomRef = db.collection('rooms');

        let date = new Date().getTime();
        let body = req.body;
        let providerName = req.query.channel ? req.query.channel : null;        
        let events = body.events;
        let providerId = body.destination ? body.destination : null;
                        
            for (let item in events) {
                
                let event = events[item];
                // let timestamp = new Date(event.timestamp);
                let timestamp = event.timestamp;

                // find channel
                let channels = await channelRef.where('uid', '==', providerId).get();
                
                if (channels.size === 0) {
                    console.error({ "function": "/messages/webhook", "data": { "message": "Channel not found", "requestId": requestId } });
                    return res.status(400).send('Channel not found.');
                } else {
                    let channelDocs = [];
                    
                    channels.forEach(doc => { 
                        channelDocs.push({id: doc.id, data: doc.data()}); 
                    });
                    
                    for (let channelDoc in channelDocs){
                        
                        let channelId = channelDocs[channelDoc].id;
                        let channel = channelDocs[channelDoc].data;

                        // find room
                        let providerRoomId = event.source.userId;
                        let rooms = await roomRef.where('channel_id', '==', channelId).where('provider_room_id', '==', providerRoomId).limit(1).get();
                        let room = null;
                        let roomId = null;
                        let providerReplyToken = event.replyToken ? event.replyToken : "";
                        if (rooms.size === 0) {
                            let roomData = {
                                channel_id: channelId,
                                provider_room_id: providerRoomId,
                                unread_count: 0,
                                status: 'active',
                                created_at: date,
                                updated_at: date,
                                timestamp: date
                            };

                            //////////////////////////////////////////////
                            console.log({ "function": "/messages/webhook", "data": { "roomData": JSON.stringify(roomData), "requestId": requestId } });

                            if (event.type === "follow") {
                                roomData.status = "active";
                            }else if (event.type === "unfollow") {
                                roomData.status = "inactive";
                            }
                            
                            let doc = await roomRef.add(roomData);
                            doc = await roomRef.doc(doc.id).get();
                            roomId = doc.id;
                            room = doc.data();
                        } else {
                            rooms.forEach(doc => {
                                roomId = doc.id;
                                room = doc.data();
                                return;
                            });
                        }

                        const line = require('@line/bot-sdk');
                        const client = new line.Client({
                            channelAccessToken: channel.access_token,
                            channelSecret: channel.secret
                        });

                        if (event.type === "message") {
                            var message = {};
                            if (event.message.type === "text") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = event.message.text;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                };
                                let messageData = {
                                    message: providerMessageText,
                                    provider_message_id: providerMessageId,
                                    direction: "recieve",
                                    type: "text",
                                    status: "delivery",
                                    created_at: timestamp,
                                };
                                message = messageData
                                roomRef.doc(roomId).set(roomData, { merge: true });
                                roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            } else if (event.message.type === "image") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "";
                                let fileName = event.message.id;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date
                                };

                                let stream = await client.getMessageContent(providerMessageId);
                                let path = 'images/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
                                let contentType = stream.headers['content-type'];
                                let data = [];
                                const bucketRef = admin.storage().bucket('gs://lineoa-c2e7a.appspot.com/');
                                const file = bucketRef.file(path + fileName);
                                stream.on('error', (err) => {
                                    console.error({ "function": "/messages/webhook", "data": { "message": "Save image error", "requestId": requestId, "error": JSON.stringify(err) } });
                                });
                                stream.on('data', (chunk) => {
                                    data.push(chunk);
                                });
                                stream.on('end', () => {
                                    let buf = Buffer.concat(data);
                                    file.save(buf, {
                                        contentType: contentType
                                    }).then(() => {
                                        file.getSignedUrl({
                                            action: 'read',
                                            expires: '12-31-2099'
                                        }).then((url) => {
                                            let providerMessageImgUrl = url[0];
                                            let messageData = {
                                                image_url: providerMessageImgUrl,
                                                provider_message_id: providerMessageId,
                                                direction: "recieve",
                                                type: "image",
                                                status: "delivery",
                                                created_at: timestamp,
                                            };
                                            roomRef.doc(roomId).set(roomData, { merge: true });
                                            roomRef.doc(roomId).collection('messages').doc().set(messageData);
                                            message = messageData
                                        });
                                    });
                                });
                            } else if (event.message.type === "video") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "";
                                let fileName = event.message.id;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                };

                                let stream = await client.getMessageContent(providerMessageId);
                                let path = 'videos/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
                                let contentType = stream.headers['content-type'];
                                let data = [];
                                const bucketRef = admin.storage().bucket('gs://lineoa-c2e7a.appspot.com/');
                                const file = bucketRef.file(path + fileName);
                                stream.on('error', (err) => {
                                    console.error({ "function": "/messages/webhook", "data": { "message": "Save video error", "requestId": requestId, "error": JSON.stringify(err) } });
                                });
                                stream.on('data', (chunk) => {
                                    data.push(chunk);
                                });
                                stream.on('end', () => {
                                    let buf = Buffer.concat(data);
                                    file.save(buf, {
                                        contentType: contentType
                                    }).then(() => {
                                        file.getSignedUrl({
                                            action: 'read',
                                            expires: '12-31-2099'
                                        }).then((url) => {
                                            let providerMessageImgUrl = url[0];
                                            let messageData = {
                                                image_url: providerMessageImgUrl,
                                                provider_message_id: providerMessageId,
                                                direction: "recieve",
                                                type: "video",
                                                status: "delivery",
                                                created_at: timestamp,
                                            };
                                            message = messageData
                                            roomRef.doc(roomId).set(roomData, { merge: true });
                                            roomRef.doc(roomId).collection('messages').doc().set(messageData);
                                        });
                                    });
                                });
                            } else if (event.message.type === "sticker") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "";
                                let fileName = event.message.id;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                    timestamp: date,
                                };

                                let providerMessageImgUrl = "https://stickershop.line-scdn.net/stickershop/v1/sticker/"+event.message.stickerId+"/android/sticker.png";
                                let messageData = {
                                    image_url: providerMessageImgUrl,
                                    provider_message_id: providerMessageId,
                                    direction: "recieve",
                                    type: "sticker",
                                    status: "delivery",
                                    created_at: timestamp,
                                };
                                message = messageData
                                roomRef.doc(roomId).set(roomData, { merge: true });
                                roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            }else if (event.message.type === "location") {
                                    let providerMessageId = event.message.id;
                                    let providerMessageTitle = event.message.title ? event.message.title : "";
                                    let providerMessageAddress = event.message.address ? event.message.address : "";
                                    let providerMessageLatitude = event.message.latitude ? event.message.latitude : "";
                                    let providerMessageLongitude = event.message.longitude ? event.message.longitude : "";

                                    let providerMessageText = providerMessageAddress+" ("+providerMessageLatitude+","+providerMessageLongitude+")";

                                    let roomData = {
                                        recent_provider_reply_token: providerReplyToken,
                                        unread_count: ++room.unread_count,
                                        updated_at: date,
                                    };
                                    let messageData = {
                                        message: providerMessageText,
                                        latitude: providerMessageLatitude,
                                        longitude: providerMessageLongitude,
                                        title: providerMessageTitle,
                                        address: providerMessageAddress,
                                        provider_message_id: providerMessageId,
                                        direction: "recieve",
                                        type: "location",
                                        status: "delivery",
                                        created_at: timestamp,
                                    };
                                    message = messageData
                                    roomRef.doc(roomId).set(roomData, { merge: true });
                                    roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            } else {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "[ a " + event.message.type + " was sent. ]";

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                };
                                let messageData = {
                                    message: providerMessageText,
                                    provider_message_id: providerMessageId,
                                    direction: "recieve",
                                    type: "text",
                                    status: "delivery",
                                    created_at: timestamp,
                                };
                                message = messageData

                                roomRef.doc(roomId).set(roomData, { merge: true });
                                roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            }
                            Events.updateRecentMessages(message,roomId,"receive",room.display_name)
                        } else if (event.type === "follow") {
                            await db.collection('rooms').doc(roomId).set({
                                provider_room_id: providerRoomId,
                                recent_provider_reply_token: providerReplyToken,
                                follow_at: timestamp,
                                updated_at: date,
                                status: 'active',
                                timestamp: date
                            }, { merge: true });

                            let profile = null;
                            try {
                                profile = await client.getProfile(providerRoomId);
                                console.info({"function": "/messages/webhook", "data": {"profile": JSON.stringify(profile), "requestId": requestId}});
                            } catch (err) {
                                console.error({"function": "/messages/webhook", "data": { "message": "Error getting Profile", "response": err }});
                                return res.status(500).send({"function": "/messages/webhook", "data": { "message": "Error getting Profile", "response": err }});
                            }
                                    
                            if (profile){
                                roomRef.doc(roomId).set({
                                    provider_room_id: providerRoomId,
                                    display_name: profile.displayName,
                                    picture_url: profile.pictureUrl,
                                    timestamp: date
                                }, {merge: true});
                            }
                        } else if (event.type === "unfollow") {
                            db.collection('rooms').doc(roomId).set({
                                provider_room_id: providerRoomId,
                                unfollow_at: timestamp,
                                status: 'inactive',
                                timestamp: date
                            }, { merge: true });
                        }
                    }
                }
            }

            console.info({ "function": "/messages/webhook", "data": { "message": "finish", "requestId": requestId } });
            
            return res.status(200).send('');
    }
}

module.exports = new MessageToFirebase();