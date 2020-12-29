const {admin} = require('../config/firebase');
const https = require('https');
const slugify = require('slugify')
// const moment = require('moment');
const moment = require('moment-timezone');

const Events = {
    updateRecentMessages: async (message, roomId, direction, displayName) => {
        console.info({"function": "/updateRecentMessages", "data": { "message": "start" }});
        const db = admin.firestore();
        const roomRef = db.collection('rooms');

        console.info({"function": "/updateRecentMessages", "data": { "roomId": roomId }});
        console.info({"function": "/updateRecentMessages", "data": { "message": message }});

        if (message.type === "text"){
            recentMessage = message.message;
        }else{
            if (direction === "send") {
                recentMessage = "You sent a " + message.type;
            } else {
                recentMessage =  displayName + " sent a " + message.type;
            }
        }
        roomRef.doc(roomId).set({
            recent_message: recentMessage,
            timestamp: new Date().getTime()
        }, {merge: true}).then(()=>{
            console.info({"function": "/updateRecentMessages", "data": { "message": "Update recent message success" }});              
        });
        console.info({"function": "/updateRecentMessages", "data": { "message": "finish" }});
        return;
    },
}

module.exports = {
    Events
}