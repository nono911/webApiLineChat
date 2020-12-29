
const server = require('express');
const PORT = process.env.PORT || 8000;
const request = require('request');
const bodyParser = require('body-parser');
const lineMessaging = require('./src/classes/line-messaging');
const firebaseService = require('./src/services/messaging-firebase-service');
const messagetofirebase = require('./src/classes/message_to_firebase');
const { Files } = require('./src/classes/file');
const cors = require('cors');
const fs = require('fs');
const { admin } = require('./src/config/firebase');
const moment = require('moment');
const uniqueFilename = require('unique-filename');
const {middlewares} = require('./src/middlewares')



const multer  = require('multer')
const upload = multer()

var type = upload.single('file');

var oldday = 0;
var newday = 0;

server()
    .use(cors({ origin: true }))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: false}))
    .post('/session', function (req, res){
      messagetofirebase.firebaseSession(req, res)
    }) 
    .post('/revoke', function (req, res){
      messagetofirebase.revokeFirebaseToken(req, res)
    }) 
    .get('/', (req, res) => res.send(`Hi there! This is a nodejs-line-api running on PORT: ${ PORT }`))
    // เพิ่มส่วนของ Webhook เข้าไป
    .post('/webhook', function (req, res) {
       try { 
          //  messagetofirebase.asyncCall();
          messagetofirebase.messageApi(req,res);
       } catch (error) {
         console.error({ "function": "/messages/send", "data": { "message": 'Parse text message error', "error": JSON.stringify(error) } });
         return res.status(400).send({ error: error.toString() });
       }
        // console.log(JSON.stringify(req.body));
       
        // let type = req.body.events[0].message.type;
        
        // let replyToken = req.body.events[0].replyToken;
        // if (type == 'text') {
        //   let message = req.body.events[0].message.text;
        //   console.log(`Message from chat : ${message}`);
        // }
        // let userID =  req.body.events[0].source.userId;
        // let timestamp = req.body.events[0].timestamp;
        // let msgid = req.body.events[0].message.id;

        // if (type == 'sticker') {
        //   let packageId = req.body.events[0].message.packageId;
        //   let stickerId = req.body.events[0].message.stickerId;
        //   console.log(`packageId : ${packageId}`);
        //   console.log(`stickerId : ${stickerId}`);

        // }

        // console.log(`type : ${ type }`);
        // console.log(`id : ${ msgid }`);
        // console.log(`Message token : ${ replyToken }`);
      
        // console.log(`UserID : ${ userID }`);
        // console.log(`timestamp : ${ timestamp }`);
        // firebaseService.savemessagefromusers(req);
        // //firebaseService.savemessagefromuser(userID, replyToken, msgid, type, message,timestamp);
        
        // if (type=="image")
        // {
        //  // lineMessaging.getImage(userID,replyToken,msgid);
        // }
        // else if (message=="car" || message.toString().toLowerCase()=="notify" )
        // {
        //   lineMessaging.replyFlexMessage(replyToken, message,userID).then(function (rs) {

        //       console.log(`Reply message result : ${ rs }`);

        //       res.json({
        //           status: 200,
        //           message: `Sent message!`
        //       });
        //   });
        // }

        // if (type=="text" && message!="car" && message!="notify"  ) {
        //   console.log("Hello")
        //   lineMessaging.replyMessage(replyToken, message,userID).then(function (rs) {

        //     console.log(`Reply message result : ${ rs }`);

        //     res.json({
        //         status: 200,
        //         message: `Ok`
        //     });
        // });
        // }
    })
    .post('/sendmessage',middlewares.checkAuthenticated , function (req,res) {
      messagetofirebase.sendMessage(req,res)
    })
    .post('/upload/image', type,middlewares.checkAuthenticated, async function (req,res) {
      console.log(`Processed file ${req.file.originalname}`);
      let ext = require('path').extname(req.file.originalname);
      console.log(`Processed file ${req.body.room_id}`);

      if (req.body.room_id === 'undefined') {
        res.status(400).send('room_id not found.');
      }

      let path = 'images/messages/' + moment().year() + '/' + moment().month() + '/' + req.body.room_id + '/';
      console.log({ "function": "/files/uploadImage", "data": { "path": path} });
      let newFileName = uniqueFilename('');
      console.log("newFileName = "+newFileName);
      let contentType = req.file.mimetype;
      const bucketRef = admin.storage().bucket('gs://lineoa-c2e7a.appspot.com/');
      console.log(path + newFileName);
 
      const bucketFile = bucketRef.file(path + newFileName + ext);
      await bucketFile.save(req.file.buffer, { contentType: contentType })
      let imageUrls = await bucketFile.getSignedUrl({ action: 'read', expires: '12-31-2099' });
      await res.send({url: imageUrls[0]});
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function intervalFunc() {
//  console.log('Cant stop me now!');
  var d = new Date();
  var day = d.getDate();
  newday = day;
  if (newday != oldday)
  {
     oldday = newday;
    // set listener
    firebaseService.setAllListener();
  }

}
  setInterval(intervalFunc, 2000);
