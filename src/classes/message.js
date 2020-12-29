/* eslint-disable no-empty */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
// messages module
const { admin } = require('../../config/firebase');
const { check, validationResult } = require('express-validator');
const { middlewares } = require('../../middlewares');
const { Markdown } = require('../../helpers/markdown');
const queryString = require('query-string');
const moment = require('moment');

const Messages = {
    send: [
        [
            // check('type').not().isEmpty().withMessage('type is required')
            // check('type').not().isEmpty().withMessage('type is required').enum(['text', 'image']).withMessage('type must in text or image'),
            // check('text').not().isEmpty().withMessage('text is required'),
            // check('image_url').not().isEmpty().withMessage('image_url is required').isURL().withMessage('image_url must be url format'),
            // check('preview_image_url').not().isEmpty().withMessage('preview_image_url is required').isURL().withMessage('preview_image_url must be url format'),
        ],
        middlewares.checkValidationResult,
        async (req, res) => {
            let hrstart;
            let hrend;

            hrstart = process.hrtime();
            
            console.info({ "function": "/messages/send", "data": { "message": "start" } });
            console.log({ "function": "/messages/send", "data": { "request": { query: JSON.stringify(req.query), body: JSON.stringify(req.body) } } });
            let body = req.body;

            let providerName = req.query.channel ? req.query.channel : null;
            let channelId = req.query.id ? req.query.id : null;
            let roomId = req.query.room_id ? req.query.room_id : null;
            let bridgeBroadcastId = req.query.bridge_broadcast_id ? req.query.bridge_broadcast_id : null;
            let source = req.query.source ? req.query.source : null;
            let userId = req.user_id ? req.user_id : null;

            const db = admin.firestore();
            const spaceRef = db.collection('spaces');
            const channelRef = db.collection('channels');
            const roomRef = db.collection('rooms');
            const packageRef = db.collection('packages');
            const stickerRef = db.collection('stickers');

            let channel = null;
            let room = null;

            // find channel
            let channels = await channelRef.doc(channelId).get();
            if (channels.exists) {
                channelId = channels.id;
                channel = channels.data();
            } else {
                console.error({ "function": "/messages/send", "data": { "message": "Channel not found", "channelId": channelId } });
                return res.status(400).send('Channel not found.');
            }

            // find room
            let rooms = await roomRef.doc(roomId).get();
            if (rooms.exists) {
                roomId = rooms.id;
                room = rooms.data();
            } else {
                console.error({ "function": "/messages/send", "data": { "message": "Room not found", "roomId": roomId } });
                return res.status(400).send('Room not found.');
            }
            
            //get timestamp of last recieve message
            let lastMessages = await roomRef.doc(roomId).collection('messages').where('direction', '==', 'recieve').orderBy('created_at','desc').limit(1).get();
            let lastMessage = null;
            let absence = null;
       
            if (lastMessages.size > 0) {
                lastMessages.forEach(doc => {
                    lastMessage = doc.data();
                    return;
                });
                //diff this time with now
                let timestamp = new Date().getTime();
                absence = moment(timestamp).diff(moment(lastMessage.created_at), 'hours', true);
            }
            console.log({ "function": "/messages/send", "data": { "absence": absence } });

            if (providerName == 'line') {
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
                        try {
                            textMsg = await Markdown.parse(textMsg, {roomId: roomId});
                        } catch (error) {
                            console.error({ "function": "/messages/send", "data": { "message": 'Parse text message error', "error": JSON.stringify(error) } });
                            return res.status(400).send({ error: error.toString() });
                        }
                        
                        messageData = {
                            message: textMsg,
                            client_message_id: clientMessageId,
                            provider_message_id: null,
                            user_id: userId,
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
                            direction: "send",
                            type: "image",
                            status: "pending",
                            created_at: date,
                            updated_at: date
                        };

                        // let qs = queryString.parseUrl(imageMsg);
                        // qs.query.timestamp = date;
                        // qs.query.sourceName = "line";
                        // imageMsg = qs.url + "?" + queryString.stringify(qs.query);

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

                        // let qs = queryString.parseUrl(videoMsg);
                        // qs.query.timestamp = date;
                        // qs.query.sourceName = "line";
                        // videoMsg = qs.url + "?" + queryString.stringify(qs.query);

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
                        let packages = await packageRef.doc(stickerPackage).get();
                        if (packages.exists) {
                            providerPackageId = packages.data().provider_package_id;
                        } else {
                            console.error({ "function": "/messages/send", "data": { "message": "Package not found", "packageId": stickerPackage } });
                            return res.status(400).send('Package not found.');
                        }

                        //find provider sticker id
                        let stickers = await stickerRef.doc(stickerMsg).get();
                        if (stickers.exists) {
                            providerStickerId = stickers.data().provider_sticker_id;
                            stickerImage = stickers.data().image;
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
                            updated_at: date
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
                }
                hrend = process.hrtime(hrstart);
                console.info('(1) Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
                console.log({ "function": "/messages/send", "data": { "messagePayloads": JSON.stringify(messagePayloads) } });

                hrstart = process.hrtime();
                let client
                try {
                    client = new line.Client({
                        channelAccessToken: channel.access_token,
                        channelSecret: channel.secret
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

                console.log({"function": "/messages/send", "data": { "provider_room_id": room.provider_room_id }});

                client.pushMessage(room.provider_room_id, messagePayloads)
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
            } else if (providerName == 'facebook') {
                if (!Array.isArray(body)){ body = [body]; }
                console.log({ "function": "/messages/send", "data": { "body": JSON.stringify(body) } });
                let date = new Date().getTime();
                let messageDatas = [];
                let messagePayloads = [];
                let messageIds = [];

                let roomData = {
                    updated_at: date,
                    timestamp: date
                };
                for (let item in body) {
                    let messageObject = body[item];
                    let messageType = messageObject.type;
                    let textMsg = messageObject.text;
                    let imageMsg = messageObject.image_url;
                    let videoMsg = messageObject.video_url;
                    let previewImageMsg = messageObject.preview_image_url;
                    let clientMessageId = messageObject.client_message_id ? messageObject.client_message_id : null;
                    let flexMsg = messageObject.contents;
                    let templateMsg = messageObject.template;

                    let messageData;
                    let messagePayload;
    
                    let date = new Date().getTime();

                    if (messageType === "text") {
                        messageData = {
                            message: textMsg,
                            client_message_id: clientMessageId,
                            provider_message_id: null,
                            user_id: userId,
                            direction: "send",
                            type: "text",
                            status: "pending",
                            created_at: date,
                            updated_at: date
                        };
                        messagePayload = {
                            recipient: { id: room.provider_room_id },
                            message: { text: textMsg },
                            // "messaging_type": "MESSAGE_TAG",
                            // "tag": "NON_PROMOTIONAL_SUBSCRIPTION"
                        };
                    } else if (messageType === "image") {
                        messageData = {
                            image_url: imageMsg,
                            client_message_id: clientMessageId,
                            provider_message_id: null,
                            user_id: userId,
                            direction: "send",
                            type: "image",
                            status: "pending",
                            created_at: date,
                            updated_at: date
                        };
                        messagePayload = {
                            recipient: { id: room.provider_room_id },
                            message: {
                                attachment: {
                                    type: "image",
                                    payload: { url: imageMsg, is_reusable: true }
                                }
                            }
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
                            recipient: { id: room.provider_room_id },
                            message: {
                                attachment: {
                                    type: "video",
                                    payload: { url: videoMsg, is_reusable: true }
                                }
                            }
                        };
                    } else if (messageType === "template") {
                        messageData = {
                            template: templateMsg,
                            client_message_id: clientMessageId,
                            provider_message_id: null,
                            user_id: userId,
                            direction: "send",
                            type: "template",
                            status: "pending",
                            created_at: date,
                            updated_at: date
                        };
                        messagePayload = {
                            recipient: { id: room.provider_room_id },
                            message: {
                                attachment: {
                                    type: "template",
                                    payload: templateMsg
                                }
                            }
                        };
                    }

                    if ((absence > 24) || (absence === null)){
                        messagePayload.messaging_type = "MESSAGE_TAG";
                        messagePayload.tag = "NON_PROMOTIONAL_SUBSCRIPTION";
                    }

                    await roomRef.doc(roomId).set(roomData, { merge: true });
                    let message = await roomRef.doc(roomId).collection('messages').add(messageData);
                    if (bridgeBroadcastId){ messageData.bridge_broadcast_id = parseInt(bridgeBroadcastId); }
                    if (source){ messageData.source = source; }
                    messageDatas.push(messageData);
                    messagePayloads.push(messagePayload);
                    messageIds.push(message.id);                 
                }

                let url = "https://graph.facebook.com/v3.3/me/messages?access_token=" + channel.access_token;
                for (let i=0; i<messageIds.length; i++) {
                    let messageId = messageIds[i];
                    let messagePayload = messagePayloads[i];

                    const request = require('request');
                    console.log({ "function": "/messages/send", "data": { "messagePayload": JSON.stringify(messagePayload) } });
                    request.post(url, {
                        json: messagePayload
                    }, function (error, response, body) {
                        // console.log({ "function": "/messages/send", "data": { "body": JSON.stringify(body) } });
                        if (!error && response.statusCode == 200) {
                            let date = new Date().getTime();
                            let providerMessageId = body.message_id.replace(/^m_/gi, "").replace(/^m./gi, "");
                            let messageData = {
                                provider_message_id: providerMessageId,
                                status: "delivery",
                                error: "",
                                updated_at: date
                            };
                            roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true });
                        } else {
                            let date = new Date().getTime();
                            let messageData = {
                                status: "fail",
                                error: JSON.stringify(body),
                                updated_at: date
                            };
                            roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true });
                            console.error({ "function": "/messages/send", "data": { "message": 'Error Send Message', "body": JSON.stringify(body) } });
                        }
                    });
                }
                
                console.info({ "function": "/messages/send", "data": { "message": "finish" } });
                if (messageIds.length <= 1){
                    return res.status(200).send({
                        message_id: messageIds[0]
                    }); 
                }
                return res.status(200).send({
                    message_ids: messageIds
                }); 
            }
        }
    ],
    reply: [
        [
            // check('type').not().isEmpty().withMessage('type is required'),
            // check('type').not().isEmpty().withMessage('type is required').enum(['text', 'image']).withMessage('type must in text or image'),
            // check('text').not().isEmpty().withMessage('text is required'),
            // check('image_url').not().isEmpty().withMessage('image_url is required').isURL().withMessage('image_url must be url format'),
            // check('preview_image_url').not().isEmpty().withMessage('preview_image_url is required').isURL().withMessage('preview_image_url must be url format'),
            // check('reply_token').not().isEmpty().withMessage('reply_token is required')
        ],
        async (req, res) => {
            console.info({ "function": "/messages/reply", "data": { "message": "start" } });
            console.info({ "function": "/messages/reply", "data": { "request": { query: JSON.stringify(req.query), body: JSON.stringify(req.body) } } });
            // let userId = req.user_id;
            let body = req.body;
            let providerName = req.query.channel ? req.query.channel : null;
            let channelId = req.query.id ? req.query.id : null;
            let roomId = req.query.room_id ? req.query.room_id : null;
            const line = require('@line/bot-sdk');
            const db = admin.firestore();
            const spaceRef = db.collection('spaces');
            const channelRef = db.collection('channels');
            const roomRef = db.collection('rooms');

            let channel = null;
            let room = null;

            // find channel
            let channels = await channelRef.doc(channelId).get();
            if (channels.exists) {
                channelId = channels.id;
                channel = channels.data();
            } else {
                console.error({ "function": "/messages/reply", "data": { "message": "Channel not found", "channelId": channelId } });
                return res.status(400).send('Channel not found.');
            }

            if (channel.channel !== 'line') {
                console.error({ "function": "/messages/reply", "data": { "message": "Channel must be line" } });
                return res.status(400).send('Channel must be line.');
            }

            // find room
            let rooms = await roomRef.doc(roomId).get();
            if (rooms.exists) {
                roomId = rooms.id;
                room = rooms.data();
            } else {
                console.error({ "function": "/messages/reply", "data": { "message": "Room not found", "roomId": roomId } });
                return res.status(400).send('Room not found.');
            }

            if (!room.recent_provider_reply_token){
                console.error({ "function": "/messages/reply", "data": { "message": "ReplyToken not found" } });
                return res.status(400).send('ReplyToken not found.');
            }
            let providerReplyToken = room.recent_provider_reply_token;

            if (!Array.isArray(body)){ body = [body]; }

            let messageDatas = [];
            let messagePayloads = [];
            let messageIds = [];
            for (let item in body) {
                let messageObject = body[item];
                let messageType = messageObject.type;
                let textMsg = messageObject.text;
                let stickerMsg = messageObject.sticker_id;
                let stickerPackage = messageObject.package_id;
                let imageMsg = messageObject.image_url;
                let videoMsg = messageObject.video_url;
                let previewImageMsg = messageObject.preview_image_url;
                let flexMsg = messageObject.contents;
                let templateMsg = messageObject.template;

                let messageId;
                let messageData;
                let messagePayload;
                let replyData;

                let date = new Date().getTime();

                let roomData = {
                    updated_at: date,
                    timestamp: date
                };

                if (messageType === "text") {
                    //parse text message
                    try {
                        textMsg = await Markdown.parse(textMsg, {roomId: roomId});
                    } catch (error) {
                        console.error({ "function": "/messages/reply", "data": { "message": 'Parse text message error', "error": JSON.stringify(error) } });
                        return res.status(400).send({ error: error.toString() });
                    }
                    
                    messageData = {
                        message: textMsg,
                        provider_message_id: null,
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
                        provider_message_id: null,
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
                        provider_message_id: null,
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
                    let packages = await packageRef.doc(stickerPackage).get();
                    if (packages.exists) {
                        providerPackageId = packages.data().provider_package_id;
                        stickerImage = stickers.data().image;
                    } else {
                        console.error({ "function": "/messages/send", "data": { "message": "Package not found", "packageId": stickerPackage } });
                        return res.status(400).send('Package not found.');
                    }

                    //find provider sticker id
                    let stickers = await stickerRef.doc(stickerMsg).get();
                    if (stickers.exists) {
                        providerStickerId = stickers.data().provider_sticker_id;
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
                        updated_at: date
                    };
                    messagePayload = {
                        type: "sticker",
                        packageId: providerPackageId,
                        stickerId: providerStickerId
                    };
                }
                await roomRef.doc(roomId).set(roomData, { merge: true });
                let message = await roomRef.doc(roomId).collection('messages').add(messageData);
                messageDatas.push(messageData);
                messagePayloads.push(messagePayload);
                messageIds.push(message.id);
            }

            let client
            try {
                client = new line.Client({
                    channelAccessToken: channel.access_token,
                    channelSecret: channel.secret
                });
            } catch (error) {
                console.error({ "function": "/messages/reply", "data": { "message": 'Get line client error', "error": JSON.stringify(error) } });

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

            console.log({"function": "/messages/reply", "data": { "messagePayloads": JSON.stringify(messagePayloads) }});
                
            client.replyMessage(providerReplyToken, messagePayloads)
                .then(() => {
                    for (let item in messageIds) {
                        let date = new Date().getTime();
                        let messageId = messageIds[item];
                        let messageData = {
                            provider_message_id: null,
                            status: "delivery",
                            error: "",
                            updated_at: date
                        };
                        roomRef.doc(roomId).collection('messages').doc(messageId).set(messageData, { merge: true });
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
                    console.error({ "function": "/messages/reply", "data": { "message": 'Error Send Message', "error": JSON.stringify(err) } });
                });
            return res.status(200).send({
                message_ids: messageIds
            }); 
        }
    ],
    markAsRead: [
        [
            check('room_id').not().isEmpty().withMessage('room_id is required'),
        ],
        async (req, res) => {
            console.info({ "function": "/messages/markAsRead", "data": { "message": "start"} });
            const db = admin.firestore();
            const spaceRef = db.collection('spaces');
            const channelRef = db.collection('channels');
            const roomRef = db.collection('rooms');
            const userRef = db.collection('users');

            let body = req.body;
            let roomId = body.room_id;
            let channel = null;
            let room = null;
            let channelId = null;

            // find room
            let rooms = await roomRef.doc(roomId).get();
            if (rooms.exists) {
                roomId = rooms.id;
                room = rooms.data();
            } else {
                console.error({ "function": "/messages/markAsRead", "data": { "message": "Room not found", "roomId": roomId } });
                return res.status(400).send('Room not found.');
            }

            // find channel
            let channels = await channelRef.doc(room.channel_id).get();
            if (channels.exists) {
                channelId = channels.id;
                channel = channels.data();
            } else {
                console.error({ "function": "/messages/markAsRead", "data": { "message": "Channel not found", "channelId": channelId } });
                return res.status(400).send('Channel not found.');
            }

            if (channel.channel !== 'line') {
                console.error({ "function": "/messages/markAsRead", "data": { "message": "Channel must be line" } });
                return res.status(400).send('Channel must be line.');
            }
            
            let payload = { chat: { userId: room.provider_room_id } };

            //request line to mark as read
            let url = "https://api.line.me/v2/bot/message/markAsRead";
            const request = require('request');

            request({
                uri: url,
                method: 'POST',
                headers: {
                    Authorization: "Bearer " + channel.access_token,
                    Accept: 'application/json',
                },
                json: payload
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log({ "function": "/messages/markAsRead", "data": { "message": "Mark as read messages success" } });
                }
            });
            
            console.info({ "function": "/messages/markAsRead", "data": { "message": "finish"} });
            return res.status(200).send({}); 
        }
    ],
    webhook: async (req, res) => {
        const uuidv1 = require('uuid/v1');
        let requestId = uuidv1();

        console.info({ "function": "/messages/webhook", "data": { "message": "start", "requestId": requestId } });
        console.info({ "function": "/messages/webhook", "data": { "request": { query: JSON.stringify(req.query), body: JSON.stringify(req.body) }, "requestId": requestId } });
        const db = admin.firestore();
        const spaceRef = db.collection('spaces');
        const channelRef = db.collection('channels');
        const roomRef = db.collection('rooms');
        const userRef = db.collection('users');

        let date = new Date().getTime();
        let body = req.body;
        let providerName = req.query.channel ? req.query.channel : null;

        // console.log({ "function": "/messages/webhook", "data": { "providerName": providerName, "requestId": requestId } });
        
        if (providerName == 'line') {
            let events = body.events;
            let providerId = req.query.id ? req.query.id : null;
            
            console.log({ "function": "/messages/webhook", "data": { "providerId": providerId, "requestId": requestId } });
            
            for (let item in events) {
                
                let event = events[item];
                // let timestamp = new Date(event.timestamp);
                let timestamp = event.timestamp;

                // find channel
                let channels = await channelRef.where('channel', '==', providerName).where('provider_id', '==', providerId).where('is_deleted', '==', false).get();
                
                if (channels.size === 0) {
                    console.error({ "function": "/messages/webhook", "data": { "message": "Channel not found", "requestId": requestId } });
                    return res.status(400).send('Channel not found.');
                } else {
                    let channelDocs = [];
                    
                    channels.forEach(doc => { 
                        channelDocs.push({id: doc.id, data: doc.data()}); 
                    });
                    
                    for (let channelDoc in channelDocs){
                        // console.log(channelDocs[channelDoc].id);
                        // console.log(channelDocs[channelDoc].data);
    
                        let channelId = channelDocs[channelDoc].id;
                        let channel = channelDocs[channelDoc].data;

                        console.log({ "function": "/messages/webhook", "data": { "channelId": channelId, "channelName": channel.name , "requestId": requestId } });

                        // find room
                        let providerRoomId = event.source.userId;
                        let rooms = await roomRef.where('channel_id', '==', channelId).where('provider_room_id', '==', providerRoomId).where('is_deleted', '==', false).limit(1).get();
                        let room = null;
                        let roomId = null;
                        let providerReplyToken = event.replyToken ? event.replyToken : "";

                        if (rooms.size === 0) {
                            console.log({ "function": "/messages/webhook", "data": { "message": "create new room", "channelId": channelId, "requestId": requestId } });
                            let roomSpaces = channel.spaces;
                            // let roomSpaces = Object.keys(channel.spaces);
                            let roomData = {
                                spaces: roomSpaces,
                                channel_id: channelId,
                                provider_room_id: providerRoomId,
                                unread_count: 0,
                                note: "",
                                status: 'active',
                                is_deleted: false,
                                created_at: date,
                                updated_at: date,
                                timestamp: date
                            };
                            console.log({ "function": "/messages/webhook", "data": { "roomSpaces": JSON.stringify(roomSpaces), "channelId": channelId, "requestId": requestId } });

                            // set default tags
                            let roomTags = {};
                            let rawTags = [];
                            for (let _item in roomSpaces){
                                
                                let spaceId = roomSpaces[_item];
                                console.log({ "function": "/messages/webhook", "data": { "spaceId": spaceId, "requestId": requestId } });
                                let doc = await spaceRef.doc(spaceId).get();
                                let space = doc.data();
                                console.log({ "function": "/messages/webhook", "data": { "space": JSON.stringify(space), "requestId": requestId } });
                                if (space.default_tags){
                                    let defaultTags = space.default_tags;
                                    for (let key in defaultTags){
                                        if (defaultTags[key] === true){
                                            rawTags.push(key);
                                        }
                                    }
                                }
                            }
                            console.log({ "function": "/messages/webhook", "data": { "rawTags": JSON.stringify(rawTags), "requestId": requestId } });

                            if (rawTags.length > 0){
                                rawTags = [...new Set(rawTags)];
                                for (let _item in rawTags){
                                    roomTags[rawTags[_item]] = true;
                                }  
                                roomData.tags = roomTags;
                            }
                            console.log({ "function": "/messages/webhook", "data": { "roomData": JSON.stringify(roomData), "requestId": requestId } });
                            //////////////////////////////////////////////

                            if (event.type === "follow") {
                                roomData.status = "active";
                            }else if (event.type === "unfollow") {
                                roomData.status = "inactive";
                            }
                            
                            console.log({ "function": "/messages/webhook", "data": { "roomData": JSON.stringify(roomData), "requestId": requestId } });

                            let doc = await roomRef.add(roomData);
                            doc = await roomRef.doc(doc.id).get();
                            roomId = doc.id;
                            room = doc.data();

                            let url = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/rooms/" + roomId + "/profile/fetch";
                            const request = require('request');
                            request({
                                uri: url,
                                method: 'POST',
                            }, function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    console.log({ "function": "/messages/webhook", "data": { "message": "Update profile success", "requestId": requestId } });
                                }
                            });
                        } else {
                            rooms.forEach(doc => {
                                roomId = doc.id;
                                room = doc.data();
                                console.log({ "function": "/messages/webhook", "data": { "roomId": roomId, "channelId": channelId, "room": JSON.stringify(room), "requestId": requestId } });
                                return;
                            });
                        }
                        const line = require('@line/bot-sdk');
                        const client = new line.Client({
                            channelAccessToken: channel.access_token,
                            channelSecret: channel.secret
                        });

                        if (event.type === "message") {
                            if (event.message.type === "text") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = event.message.text;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                    timestamp: date
                                };
                                let messageData = {
                                    message: providerMessageText,
                                    provider_message_id: providerMessageId,
                                    direction: "recieve",
                                    type: "text",
                                    status: "delivery",
                                    created_at: timestamp,
                                };
                                roomRef.doc(roomId).set(roomData, { merge: true });
                                roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            } else if (event.message.type === "image") {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "";
                                let fileName = event.message.id;

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                    timestamp: date
                                };

                                let stream = await client.getMessageContent(providerMessageId);
                                let path = 'images/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
                                let contentType = stream.headers['content-type'];
                                let data = [];
                                const bucketRef = admin.storage().bucket('gs://functions-movefast-spp');
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
                                    timestamp: date
                                };

                                let stream = await client.getMessageContent(providerMessageId);
                                let path = 'videos/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
                                let contentType = stream.headers['content-type'];
                                let data = [];
                                const bucketRef = admin.storage().bucket('gs://functions-movefast-spp');
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
                                    timestamp: date
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
                                        timestamp: date
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
                                    roomRef.doc(roomId).set(roomData, { merge: true });
                                    roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            } else {
                                let providerMessageId = event.message.id;
                                let providerMessageText = "[ a " + event.message.type + " was sent. ]";

                                let roomData = {
                                    recent_provider_reply_token: providerReplyToken,
                                    unread_count: ++room.unread_count,
                                    updated_at: date,
                                    timestamp: date
                                };
                                let messageData = {
                                    message: providerMessageText,
                                    provider_message_id: providerMessageId,
                                    direction: "recieve",
                                    type: "text",
                                    status: "delivery",
                                    created_at: timestamp,
                                };
                                roomRef.doc(roomId).set(roomData, { merge: true });
                                roomRef.doc(roomId).collection('messages').doc().set(messageData);
                            }
                        } else if (event.type === "follow") {
                            console.log({ "function": "/messages/webhook", "data": { "event.type": event.type, "requestId": requestId } });
                            await db.collection('rooms').doc(roomId).set({
                                provider_room_id: providerRoomId,
                                recent_provider_reply_token: providerReplyToken,
                                follow_at: timestamp,
                                updated_at: date,
                                status: 'active',
                                timestamp: date
                            }, { merge: true });

                            console.log({ "function": "/messages/webhook", "data": { "greeting_message": JSON.stringify(channel.greeting_messages), "requestId": requestId } });
                            //send greeting message
                            if (channel.greeting_messages){
                                let greetingMessages = channel.greeting_messages;
                                if (greetingMessages.status === "active"){

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
                                        }, {merge: true}).then(()=>{
                                            console.log({"function": "/messages/webhook", "data": { "message": "Update profile success", "requestId": requestId }}); 
                                            // let url = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/messages/reply" + "?id=" + channelId + "&channel=" + channel.channel + "&room_id=" + roomId;
                                            let url = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/messages/send" + "?id=" + channelId + "&channel=" + channel.channel + "&room_id=" + roomId;
                                            console.log({ "function": "/messages/webhook", "data": { "url":url, "requestId": requestId} });

                                            let greetingMessage = greetingMessages.data;
                                            let payloadMessages = [];
                                            for (let item in greetingMessage) {
                                                if (greetingMessage[item].type === "text") {
                                                    data = {
                                                        type: "text",
                                                        text: greetingMessage[item].message
                                                    };
                                                    payloadMessages.push(data);
                                                } else if (greetingMessage[item].type === "image") {
                                                    data = {
                                                        type: "image",
                                                        image_url: greetingMessage[item].image_url,
                                                        preview_image_url: greetingMessage[item].preview_image_url
                                                    }
                                                    payloadMessages.push(data);
                                                } else if (greetingMessage[item].type === "video") {
                                                    data = {
                                                        type: "video",
                                                        video_url: greetingMessage[item].video_url,
                                                        preview_image_url: greetingMessage[item].preview_image_url
                                                    }
                                                    payloadMessages.push(data);
                                                }
                                            }
                                            console.log({ "function": "/messages/webhook", "data": { "payloadMessages": JSON.stringify(payloadMessages), "requestId": requestId} });

                                            const request = require('request');
                                            request({
                                                uri: url,
                                                method: 'POST',
                                                headers: {
                                                    'Accept': 'application/json',
                                                    'Authorization': "Basic c3lzdGVtOk1vdmVGYXN0",
                                                },
                                                json: payloadMessages
                                            }, function (error, response, body) {
                                                if (!error && response.statusCode == 200) {
                                                    console.log({ "function": "/messages/webhook", "data": { "response": JSON.stringify(body), "requestId": requestId} });
                                                }else{

                                                }
                                            });
                                        });
                                    }
                                }
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

        } else if (providerName == 'facebook') {
            // Your verify token. Should be a random string.
            let verifyToken = "movefast_messenger"
            // Parse the query params
            let mode = req.query['hub.mode'];
            let token = req.query['hub.verify_token'];
            let challenge = req.query['hub.challenge'];
            let body = req.body;
            // Checks if a token and mode is in the query string of the request
            if (mode && token) {
                // Checks the mode and token sent is correct
                if (mode === 'subscribe' && token === verifyToken) {
                    // Responds with the challenge token from the request
                    if (body.object === 'page') {
                        let entry = body.entry;
                        for (let item in entry) {
                            let providerId = entry[item].id;
                            let webhookEvent = entry[item].messaging[0];
                            let timestamp = webhookEvent.timestamp;

                            // find channel
                            let channels = await channelRef.where('channel', '==', providerName).where('provider_id', '==', providerId).where('is_deleted', '==', false).get();
                            
                            if (channels.size === 0) {
                                console.error({ "function": "/messages/webhook", "data": { "message": "Channel not found", "providerId": providerId, "requestId": requestId } });
                                return res.status(400).send('Channel not found.');
                            } else {
                                let channelDocs = [];
                    
                                channels.forEach(doc => { 
                                    channelDocs.push({id: doc.id, data: doc.data()});
                                });
                                
                                for (let channelDoc in channelDocs){
                                    // console.log(channelDocs[channelDoc].id);
                                    // console.log(channelDocs[channelDoc].data);
                
                                    let channelId = channelDocs[channelDoc].id;
                                    let channel = channelDocs[channelDoc].data;
                                    
                                    console.log({ "function": "/messages/webhook", "data": { "channelId": channelId, "channelName": channel.name , "requestId": requestId } });
                                    
                                    // find room
                                    let providerRoomId = webhookEvent.sender.id;
                                    let rooms = await roomRef.where('channel_id', '==', channelId).where('provider_room_id', '==', providerRoomId).where('is_deleted', '==', false).limit(1).get();
                                    let room = null;
                                    let roomId = null;

                                    if (rooms.size === 0) {
                                        console.log({ "function": "/messages/webhook", "data": { "message": "Create new room", "requestId": requestId } });
                                        //create new room
                                        let roomSpaces = channel.spaces;
                                        // let roomSpaces = Object.keys(channel.spaces);
                                        let roomData = {
                                            spaces: roomSpaces,
                                            channel_id: channelId,
                                            provider_room_id: providerRoomId,
                                            unread_count: 0,
                                            note: "",
                                            status: 'active',
                                            is_deleted: false,
                                            created_at: date,
                                            updated_at: date,
                                            timestamp: date
                                        };
                                        let doc = await roomRef.add(roomData);
                                        doc = await roomRef.doc(doc.id).get();
                                        roomId = doc.id;
                                        room = doc.data();

                                        let url = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/rooms/" + roomId + "/profile/fetch";
                                        const request = require('request');
                                        request({
                                            uri: url,
                                            method: 'POST',
                                        }, function (error, response, body) {
                                            if (!error && response.statusCode == 200) {
                                                console.log({ "function": "/messages/webhook", "data": { "message": "Update profile success", "requestId": requestId } });
                                            }
                                        });
                                    } else {
                                        rooms.forEach(doc => {
                                            roomId = doc.id;
                                            room = doc.data();
                                            return;
                                        });
                                    }

                                    if (webhookEvent.delivery) {
                                        // add message delivery from facebook messenger
                                        if (webhookEvent.delivery.mids) {
                                            let providerMessageId = webhookEvent.delivery.mids[0].replace(/^m_/gi, "").replace(/^m./gi, "");
                                            console.log({ "function": "/messages/webhook", "data": { "providerMessageId": providerMessageId, "requestId": requestId } });
                                            //get message from facebook api
                                            const request = require('request');
                                            let url = "https://graph.facebook.com/v3.3/" + "m_" + providerMessageId + "?access_token=" + channel.access_token + "&fields=message,attachments";
                                            request.get({
                                                url: url,
                                                headers: {
                                                    'Accept': 'application/json'
                                                }
                                            },
                                                async function (error, response, body) {
                                                    body = JSON.parse(body);
                                                    if (!error && response.statusCode == 200) {
                                                        //create new message
                                                        let providerMessageId = body.id.replace(/^m_/gi, "").replace(/^m./gi, "")
                                                        let roomData = {
                                                            updated_at: date,
                                                            timestamp: date
                                                        };

                                                        if (body.message && body.message !== "") {
                                                            let messageData = {
                                                                message: body.message,
                                                                provider_message_id: providerMessageId,
                                                                direction: "send",
                                                                type: "text",
                                                                status: "delivery",
                                                                created_at: timestamp
                                                            };
                                                            let messages = await roomRef.doc(roomId).collection('messages').where('provider_message_id', '==', providerMessageId).limit(1).get();
                                                            if (messages.size === 0) {
                                                                roomRef.doc(roomId).set(roomData, { merge: true });
                                                                roomRef.doc(roomId).collection('messages').doc().set(messageData).then(() => {
                                                                    console.log({ "function": "/messages/webhook", "data": { "message": "add message success", "requestId": requestId, "event": "delivery" } });
                                                                });
                                                            }
                                                        }

                                                        if (body.attachments) {
                                                            attachments = body.attachments.data;
                                                            for (let item in attachments) {
                                                                attachment = attachments[item];
                                                                if (attachment.image_data) {
                                                                    let providerMessageImgUrl = attachment.image_data.url;
                                                                    let messageData = {
                                                                        image_url: providerMessageImgUrl,
                                                                        provider_message_id: providerMessageId,
                                                                        direction: "send",
                                                                        type: "image",
                                                                        status: "delivery",
                                                                        created_at: timestamp,
                                                                    };
                                                                    let messages = await roomRef.doc(roomId).collection('messages').where('provider_message_id', '==', providerMessageId).limit(1).get();
                                                                    if (messages.size === 0) {
                                                                        roomRef.doc(roomId).set(roomData, { merge: true });
                                                                        roomRef.doc(roomId).collection('messages').doc().set(messageData).then(() => {
                                                                            console.log({ "function": "/messages/webhook", "data": { "message": "add message success", "requestId": requestId, "event": "delivery" } });
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        console.log({ "function": "/messages/webhook", "data": { "message": "add message failed", "requestId": requestId, "event": "delivery", "error": JSON.stringify(body) } });
                                                    }
                                                });
                                        }
                                    } else if (webhookEvent.message) {
                                        // Check if the event is a message or postback and
                                        // pass the event to the appropriate handler function
                                        let receivedMessage = webhookEvent.message;
                                        let providerMessageId = receivedMessage.mid.replace(/^m_/gi, "");

                                        if (receivedMessage.text) {
                                            let providerMessageText = receivedMessage.text;

                                            let roomData = {
                                                unread_count: ++room.unread_count,
                                                updated_at: date,
                                                timestamp: date
                                            };
                                            let messageData = {
                                                message: providerMessageText,
                                                provider_message_id: providerMessageId,
                                                direction: "recieve",
                                                type: "text",
                                                status: "delivery",
                                                created_at: timestamp,
                                            };
                                            
                                            roomRef.doc(roomId).set(roomData, { merge: true });
                                            
                                            roomRef.doc(roomId).collection('messages').doc().set(messageData).then(() => {
                                                
                                                console.log({ "function": "/messages/webhook", "data": { "message": "add message success", "requestId": requestId, "event": "message" } });
                                            });
                                        } else if (receivedMessage.attachments) {
                                            attachments = receivedMessage.attachments;
                                            for (let item in attachments) {
                                                let attachment = attachments[item];
                                                if (attachment.type === 'image') {
                                                    if (attachment.payload) {
                                                        if (attachment.payload.url) {
                                                            let providerMessageImgUrl = attachment.payload.url;
                                                            let roomData = {
                                                                unread_count: ++room.unread_count,
                                                                updated_at: date,
                                                                timestamp: date
                                                            };
                                                            let messageData = {
                                                                image_url: providerMessageImgUrl,
                                                                provider_message_id: providerMessageId,
                                                                direction: "recieve",
                                                                type: "image",
                                                                status: "delivery",
                                                                created_at: timestamp,
                                                            };
                                                            roomRef.doc(roomId).set(roomData, { merge: true });
                                                            await roomRef.doc(roomId).collection('messages').doc().set(messageData).then(() => {
                                                                console.log({ "function": "/messages/webhook", "data": { "message": "add image success", "requestId": requestId, "event": "message" } });
                                                            });
                                                        }
                                                    }
                                                } else {
                                                    if (attachment.payload) {
                                                        
                                                        if (attachment.payload.url) {
                                                            
                                                            let providerMessageText = "[ a " + attachment.type + " was sent. ]";
                                                            let roomData = {
                                                                unread_count: ++room.unread_count,
                                                                updated_at: date,
                                                                timestamp: date
                                                            };
                                                            let messageData = {
                                                                message: providerMessageText,
                                                                image_url: attachment.payload.url,
                                                                provider_message_id: providerMessageId,
                                                                direction: "recieve",
                                                                type: "text",
                                                                status: "delivery",
                                                                created_at: timestamp,
                                                            };

                                                            roomRef.doc(roomId).set(roomData, { merge: true });
                                                            
                                                            roomRef.doc(roomId).collection('messages').doc().set(messageData).then(() => {
                                                                console.log({ "function": "/messages/webhook", "data": { "message": "add attachment success", "requestId": requestId, "event": "message" } });
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } 
                                }
                            }
                        }
                    }
                    console.info({ "function": "/messages/webhook", "data": { "message": "finish", "requestId": requestId, "event": "message" } });
                    return res.status(200).send(challenge);
                } else {
                    // Responds with '403 Forbidden' if verify tokens do not match
                    console.error({ "function": "/messages/webhook", "data": { "message": "verify tokens do not match", "requestId": requestId } });
                    return res.sendStatus(403);
                }
            }
            console.info({ "function": "/messages/webhook", "data": { "message": "finish", "requestId": requestId } });
            
            return res.status(200).send('');
        }
    }
}

module.exports = {
    Messages
}