const { admin } = require('../config/firebase');
const serviceAccount = require('../../serviceAccountKey.json');
//const lineApiService = require('../services/line-api-service');
//const lineMessaging = require('../classes/line-messaging_1');
const LINEBot = require('line-messaging');
var db, ref;
//var listener ;
var listenerarray = [];
var listenerdevicearray = [];
var listenerRun;
var userId ="";
var count = 0;
var userOneDocumentRef 

var bot = LINEBot.Client({
  channelID: '1654310209',
  channelSecret: '1fc1633a34a35c0cee89e6f18934438f',
  channelAccessToken: 'QUot7X869EpNBeMS9h4qYjCjtiItuvF0qSc23vNCiEsorHCEn74zh1ZDMKtSlMKjWX8bpL1HlsTYB7reC+7u8oQKo3evZCsO+7T5/nrsDNiBQAQ3Xr7LEvGcmtbffKxdUZtHQpRYGbODCwLzhqplWQdB04t89/1O/w1cDnyilFU='
})


class FirebaseService {
	constructor() {
      

    


   // FirebaseApp.initializeApp(options);

   // FirebaseApp.initializeApp(options);

    //db = firebase.database();
    db =  admin.firestore();
  
	//	ref = db.ref('863703039069468');
	//    ref = db.ref('863703031805224/'+date_today());

    }

  getImagefromId(userID, replyToken, messageId) {
    bot.getMessageContent(messageId).then(function (data) {
      // add your code when success.
      download(data, userID, replyToken);
    }).catch(function (error) {
      // add your code when error.
      console.log(error);
    });
  }
    savemessagefromusers(req) {

      

      let messageType = req.body.events[0].message.type;
      let replyToken = req.body.events[0].replyToken;
      let userID = req.body.events[0].source.userId;
      let timesTamp = req.body.events[0].timestamp;
      let messageId = req.body.events[0].message.id;


      userOneDocumentRef = db.collection(userID).doc(date__today()).collection('message').doc(messageId);

      if (messageType == 'text') {
        let messages = req.body.events[0].message.text;
         userOneDocumentRef.set({
          userid: userID,
          replytoken: replyToken,
          messageid: messageId,
          messagetype: messageType,
          message: messages,
          timestamp: timesTamp
        });
      }
      if (messageType == 'sticker') {
        userOneDocumentRef.set({
          userid: userID,
          replytoken: replyToken,
          messageid: messageId,
          messagetype: messageType,
          stickerid: req.body.events[0].message.stickerId,
          packageid: req.body.events[0].message.packageId,
          timestamp: timesTamp
        });
      }
      
      if (messageType == 'image') {

        //let destination = req.body.events[0].message.destination;
        var xdata 
        bot.getMessageContent(messageId).then(function (data) {
          // add your code when success.
          // download(data, userID, replyToken);
          const img =  jimp.read(data);

          console.log(img);
          xdata = img; 
        }).catch(function (error) {
          // add your code when error.
          console.log(error);
        });

        userOneDocumentRef.set({
          userid: userID,
          replytoken: replyToken,
          messageid: messageId,
          messagetype: messageType,
          imgdata: xdata,
          timestamp: timesTamp
        });

      }
    }
    savemessagefromuser(userID, replyToken, messageId, messageType, messages, timesTamp) {
      userOneDocumentRef = db.collection(userID).doc(date__today()).collection('message').doc(messageId);
      userOneDocumentRef.set({
        userid : userID,
        replytoken : replyToken, 
        messageid : messageId,
        messagetype : messageType,
        message : messages,
        timestamp : timesTamp

      });
    }

    savecid(deviceID,userID,replyToken,callback)
    {


      var saveCID = db.ref().child('/users/' + userID );

      saveCID.set({"userID":userID, "deviceID":deviceID,"replyToken":replyToken});

      // set device detail

      saveCID = db.ref().child('/device/' + deviceID );

        db.ref().child('/device/' + deviceID ).once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if (exists==false)
            {
              saveCID.set({"userID":userID, "deviceID":deviceID,"replyToken":replyToken,"Name":"Disrupt","LastName":"everything","lplate":"1 กก 1234","expense":0.0011,"Brand":"HONDA","MODEL":"ACCORD 2.4","Year":"2015","Balance":"1000","Engine_No":"xxxxx","Insurance":"xxxxx","lplate_prov":"xxxxx"});
            }
            else
            {
              saveCID.update({"userID":userID, "deviceID":deviceID});
            }
      });



  //    botsendmessage(userID,"set cid OK " + deviceID);


      return new Promise(function (resolve, reject) {
          try {
              resolve("set cid OK " + deviceID);

          }
          catch (e) {
              return reject(e);
          }
      });
    //  callback(null, userId);


    }

    getonListenerRUN(userID)
		{
			userId = userID;
      var deviceID = "";
    //  ref = db.ref(userID) ;



      console.log("user " + userId);
      db.ref("/users/"+userID).once("value").then(function(snapshot) {
           // do some stuff once
           var uinfo = snapshot.val();
           deviceID = uinfo.deviceID;
           console.log("devcie In" + deviceID);
           if (deviceID!="") {
               ref = db.ref(deviceID+"/"+date_today());
             listenerRun =	ref.limitToLast(1).on('value', crack_time);
             console.log("run time on");
           }

      });





		}
    getAllInfo(userID,replyToken) {
      console.log("user " + userId);
      db.ref("/users/"+userID).once("value").then(function(snapshot) {
           // do some stuff once
           var uinfo = snapshot.val();
           var deviceID = uinfo.deviceID;
           var tinfo ;
           getUserInfo(deviceID, function (err, result) {
             let data = result;
             console.log(result);
             console.log(result[1]);
             console.log(data[0]);
             console.log(data[1]);
             tinfo = showallInfo(data,replyToken);


           });
         });

    }
	  getonListener(userID,replyToken) {

				/*	listener =	ref.on('value', function(data) {
					    	let _car = data.val();
					    	console.log(JSON.stringify(_car));
								bot.pushTextMessage('Ue365ec789fc464ffce7bd686e5dc4b3e', JSON.stringify(_car));
							});
				*/
        var deviceID = "";
				userId = userID;

        console.log("user " + userId);
        db.ref("/users/"+userID).once("value").then(function(snapshot) {
             // do some stuff once
             var uinfo = snapshot.val();
             deviceID = uinfo.deviceID;
             console.log("devcie In " + deviceID);
             if (deviceID!="") {
                  var ref = firebase.database().ref(deviceID+"/"+date_today());
                //var listener ;
              //  listenerarray.push(listener);

              var have =  false;

              if (listenerdevicearray != null && listenerdevicearray != 'undefined') {
                try {
                  for (var i = 0 ; i < listenerdevicearray.length ; i++ )
                  {
                     console.log( listenerdevicearray.length + " deviceID " +deviceID + " --> " + listenerdevicearray[i] )
                     if (listenerdevicearray[i]==deviceID)
                     {
                         have =true;
                         break;
                     }
                   }
                } catch (error) {console.log(error);}
              }

              if (!have) {
                // var listener ;
                    listenerdevicearray.push(deviceID);
  /* listener = */  listenerarray.push(ref.limitToLast(1).on('child_added',function(snapshot) {


                      	var nkey ;
                      	var btime ;
                      	var etime ;
                        var deviceId ="";
                        var key = "";
                        console.log(`snapshot : ${ snapshot.key }`);
                        key = snapshot.key;
                        //deviceId =  snapshot.val().deviceId;
                        btime = snapshot.val().btime;
                        etime = snapshot.val().etime;
                        deviceId = snapshot.val().deviceid;
                        console.log("Device ID " + deviceId);
                        firebase.database().ref("/device/"+deviceId).once("value").then(function(snapshot) {
                             console.log(snapshot.val());
                             userId = snapshot.val().userID;
                             console.log(userId);

                      //  console.log(userId);
                        /*
                      	snapshot.forEach(userSnapshot => {
                      			nkey = userSnapshot.key;
                      			btime = userSnapshot.val().btime;
                      			etime = userSnapshot.val().etime;
                            deviceId = userSnapshot.val().deviceid;


                      	})
                        */
                         var tinfo = btime;
                         if (btime != etime)
                         {
                             tinfo = btime + " <--> " + etime;
                         }
                         // find userid
                         var data ;
                         getUserInfo(deviceID, function (err, result) {
                            data = result;
                            console.log(result);
                            console.log(result[1]);
                            console.log(data[0]);
                            console.log(data[1]);
                            tinfo = timereport(data,btime,etime,key);
                            if( botReplyFlexmessage(replyToken,tinfo,data[0])==false)
                            {
                             // console.log("Push " + userId);
                             // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                            }

                         });
                      //    console.log("User ID " + data[0]);
                      /*
                       getReplyToken(deviceId, function (err, result) {
                          userId = result;
                          console.log("User ID " + userId);
                       });
                      */
                       //console.log("User ID 2 " + userId);





                        //  botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                      //    bot.pushTextMessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );




                    }); // find userId


                }));
              //  listenerarray.push([listener,deviceID]);
              }
              else
              {
                // send normal
                sendrequestnotify(deviceID,replyToken);
              }
         				console.log("notify on");

              //  function oncarinsurance(snapshot)
            //    {
          //       ref.once('value', gotData);
                // bot.pushTextMessage('Ue365ec789fc464ffce7bd686e5dc4b3e',  "on carinsurance ");

        //        }


             }

        });



		}
    getLastTrip(userID,replyToken) {

        /*	listener =	ref.on('value', function(data) {
                let _car = data.val();
                console.log(JSON.stringify(_car));
                bot.pushTextMessage('Ue365ec789fc464ffce7bd686e5dc4b3e', JSON.stringify(_car));
              });
        */
        var deviceID = "";
        userId = userID;

        console.log("user " + userId);
        db.ref("/users/"+userID).once("value").then(function(snapshot) {
             // do some stuff once
             var uinfo = snapshot.val();
             deviceID = uinfo.deviceID;
             console.log("devcie In " + deviceID);
             if (deviceID!="") {
                  var ref = firebase.database().ref(deviceID+"/"+date_today());
                //var listener ;
              //  listenerarray.push(listener);


                // var listener ;
                ref.limitToLast(1).once('value').then(function(snapshot) {


                      var nkey ;
                      var btime ;
                      var etime ;
                      var deviceId ="";
                      var key = "";
                      snapshot.forEach(userSnapshot => {
                        console.log(`snapshot : ${ snapshot.key }`);
                        key = snapshot.key;
                        //deviceId =  snapshot.val().deviceId;
                        btime = userSnapshot.val().btime;
                        etime = userSnapshot.val().etime;
                        deviceId = userSnapshot.val().deviceid;
                        console.log("Device ID " + deviceId);
                        firebase.database().ref("/device/"+deviceId).once("value").then(function(snapshot) {
                             console.log(snapshot.val());
                             userId = snapshot.val().userID;
                             console.log(userId);

                      //  console.log(userId);
                        /*
                        snapshot.forEach(userSnapshot => {
                            nkey = userSnapshot.key;
                            btime = userSnapshot.val().btime;
                            etime = userSnapshot.val().etime;
                            deviceId = userSnapshot.val().deviceid;


                        })
                        */
                         var tinfo = btime;
                         if (btime != etime)
                         {
                             tinfo = btime + " <--> " + etime;
                         }
                         // find userid
                         var data ;
                         getUserInfo(deviceId, function (err, result) {
                            data = result;
                            console.log(result);
                            console.log(result[1]);
                            console.log(data[0]);
                            console.log(data[1]);
                            tinfo = timereport(data,btime,etime,key);
                            if( botReplyFlexmessage(replyToken,tinfo,data[0])==false)
                            {
                             // console.log("Push " + userId);
                             // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                            }

                         });
                      //    console.log("User ID " + data[0]);
                      /*
                       getReplyToken(deviceId, function (err, result) {
                          userId = result;
                          console.log("User ID " + userId);
                       });
                      */
                       //console.log("User ID 2 " + userId);





                        //  botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                      //    bot.pushTextMessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );




                    }); // find userId

                  }) // snapshot detail

                });
              //  listenerarray.push([listener,deviceID]);



              //  function oncarinsurance(snapshot)
            //    {
          //       ref.once('value', gotData);
                // bot.pushTextMessage('Ue365ec789fc464ffce7bd686e5dc4b3e',  "on carinsurance ");

        //        }


             }

        });



    }
		getrunoffListener() {
			try {
       if (ref != null) {
				ref.off('value',listenerRun);
				console.log("run off ");
			 }
			}
			catch (e) {console.log(e); }
		}

		getoffListener() {
			try {
			 if (ref!=null) {
			//	 ref.off("child_added", listener);
				 console.log("notify off");
				}
		  }
			catch (e) {console.log(e); }
	  }

    getReport(userID,day,replyToken)
    {

        var deviceID ="";
        console.log("user " + userID);
        db.ref("/users/"+userID).once("value").then(function(snapshot) {
             // do some stuff once
             var uinfo = snapshot.val();
             deviceID = uinfo.deviceID;
             if (deviceID=="")
             {
               return;
             }
             var ddate = "";
                try {
                  if (day !="")
                  {
                      ddate = formatday(day);
                      var sdate = ddate.toString().split("/");
                     	ref = db.ref(deviceID+"/"+ddate);
                      ddate = sdate[2];
                  }
                  else
                  {
                    var ddate = date_today()
                    var sdate = ddate.toString().split("/");

                   	ref = db.ref(deviceID+"/"+ddate);
                    ddate = sdate[2];
                  }

                  ref.limitToLast(20).once('value', function(snapshot) {


                    console.log("Device Id "+deviceID);

                    getUserInfo(deviceID, function (err, result) {
                       let data = result;
                       console.log(result);
                       console.log(result[1]);
                       console.log(data[0]);
                       console.log(data[1]);

                       //        var data = [uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense];
                       // function onflexReport(snapshot,cDate,deviceId,_cost,_model,_brand,_year,_lplate) {
                       let _car = onflexReport(snapshot,ddate,deviceID,data[5],data[2],data[1],data[3],data[4],data);
                       console.log(_car);
                       botReplyFlexmessage(replyToken, /*deviceID +" " +ddate + "\n" +*/ _car,userID);

                    });




                //    if (_car.toString().length > 2000) {
                //      botReplyFlexmessage(replyToken, deviceID +" " +ddate + "\n" + _car.toString().substring(0,1500),userID);
//                      botsendmessage(userID, deviceID +" " +ddate + "\n" + _car.toString().substring(0,1500));

                //      sleep(2000);
                    //  botsendmessage(userID, deviceID +" " +ddate + "\n" + _car.toString().substring(1501,_car.toString().length));
                //       botReplyFlexmessage(replyToken, deviceID +" " +ddate + "\n" + _car.toString().substring(1501,_car.toString().length),userID);


                  //  } else {

                    //  botsendmessage(userID, deviceID +" " +ddate + "\n" + _car);

                  //  }
                  });
          }
          catch (e) {
              console.log(e);
          }
        });

    }
    getEnabledInsurance() {
        return new Promise(function (resolve, reject) {
            try {
                var ref = firebase.database().ref("863703039069468/"+date_today());
                return ref.once('value', function(snapshot) {
                    let _car = snapshot.val();
                   return resolve((flexMessageTest()));
                //    return resolve(JSON.stringify(_car));
                });
            }
            catch (e) {
                return reject(e);
            }
        });
    }

   setAllListener()
   {
     // date to listener
  //   var runfirst = 0;
     listenerdevicearray=[];
     listenerarray=[];
     firebase.database().ref("/device/").once("value").then(function(snapshot) {
       /*
       snapshot.forEach(userSnapshot => {
           nkey = userSnapshot.key;
           btime = userSnapshot.val().btime;
           etime = userSnapshot.val().etime;
           deviceId = userSnapshot.val().deviceid;


       })
       */
        //console.log(snapshot.length);
         console.log(snapshot.numChildren())
         var lengthofrecord = snapshot.numChildren();
         var lcount = 0;
         snapshot.forEach(devicenapshot => {
        //  console.log(devicenapshot.val());

          var userId = devicenapshot.val().userID;
          var  deviceId = devicenapshot.val().deviceID;

          if (deviceId != "") {

        //     var have =  false;

        //     if (/*listenerdevicearray != null && listenerdevicearray != 'undefined' ||*/ listenerdevicearray.length>0) {

               try {
                 // remove all

/*
                 for (var i = 0 ; i < listenerdevicearray.length ; i++ )
                 {
                   console.log( listenerdevicearray.length + " deviceID " +deviceId + " --> " + listenerdevicearray[i] )
                   if (listenerdevicearray[i]==deviceId)
                   {
                     // remove
                     have =true;
                     listenerdevicearray.splice(i,1);
                     listenerarray.splice(i,1);
                     break;
                   }
                     /////
                     // create
                 }
*/
                 console.log("Hi !!" + deviceId) ;
        //         console.log("Hi !!") ;
               try {
                 var ref = firebase.database().ref(deviceId+"/"+date_today());

               } catch (error) {console.log(error); }

                 listenerdevicearray.push(deviceId);
                 listenerarray.push(ref.limitToLast(1).on('child_added',function(snapshot) {
          //  listenerarray.push(ref.limitToLast(1).onCreate(snapshot => {


                                       var nkey ;
                                       var btime ;
                                       var etime ;
                                       var deviceId ="";
                                       var notify = 1;
                                    //   var userId = "";
                                       var key = "";
                                      // console.log(`snapshot : ${ snapshot.key }`);
                                       key = snapshot.key;
                                       //deviceId =  snapshot.val().deviceId;
                                       btime = snapshot.val().btime;
                                       etime = snapshot.val().etime;
                                       deviceId = snapshot.val().deviceid;
                                       notify = snapshot.val().notify;

                                       try {
                                       console.log(deviceId+"/"+date_today()+"/"+key);
                                         var letontime = firebase.database().ref(deviceId+"/"+date_today()+"/"+key);
                                         letontime.update({"notify":1});
                                       } catch (error) {console.log(error);}

                                    //   console.log("Device ID " + deviceId);
                                       firebase.database().ref("/device/"+deviceId).once("value").then(function(snapshot) {
                                          //  console.log(snapshot.val());
                                           userId = snapshot.val().userID;

                                     //  console.log(userId);
                                       /*
                                       snapshot.forEach(userSnapshot => {
                                           nkey = userSnapshot.key;
                                           btime = userSnapshot.val().btime;
                                           etime = userSnapshot.val().etime;
                                           deviceId = userSnapshot.val().deviceid;


                                       })
                                       */
                                        var tinfo = btime;
                                        if (btime != etime)
                                        {
                                            tinfo = btime + " <--> " + etime;
                                        }
                                        // find userid



                                        var data ;
                                        getUserInfo(deviceId, function (err, result) {
                                           data = result;
                                        //   console.log(result);
                                        //   console.log(result[1]);

                                           console.log("******************");
                                           console.log("getUser " + data[0]);
                                           console.log("lcount " + lcount);
                                           console.log(userId);
                                           console.log(deviceId);
                                           console.log(data[8]);
                                           console.log("******************");

                                        //   console.log(data[1]);
                                          if(data[8]==deviceId) {
                                           tinfo = timereporton(data,btime,etime,key);
                                           if (notify == 0) {
                                             console.log("send notify");
                                             if( botReplyFlexmessage("30a05d2350824d778e0bc255d5cfec2d",tinfo,data[0])==false)
                                             {
                                             // console.log("Push " + userId);
                                              // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                                             }
                                           }

                                      //  console.log("lcount " + lcount);
                                  //         console.log("lcount " + lcount + " " +deviceId);
                                      //     if (lcount == (lengthofrecord))
                                      //     {
                                      //        console.log("finish ");
                                      //        runfirst=1;
                                      //     }

                                         } // device id
                                        });

                                   }); // find userId


                               }));
                               lcount++;


               } catch (error) {console.log(error);}
             }

        //     else // device array == 00
        //     {
          //     console.log("length = 0");
          //     console.log("HELLOOOO") ;
          //     lcount++;
          //     var ref = firebase.database().ref(deviceId+"/"+date_today());
          //     listenerdevicearray.push(deviceId);
          //     listenerarray.push(ref.limitToLast(1).on('child_added',function(snapshot) {


            //                         var nkey ;
              //                       var btime ;
            //                         var etime ;
            //                         var deviceId ="";
            //                         var key = "";
            //                         console.log(`snapshot : ${ snapshot.key }`);
            //                         key = snapshot.key;
                                     //deviceId =  snapshot.val().deviceId;
              //                       btime = snapshot.val().btime;
              //                       etime = snapshot.val().etime;
              //                       deviceId = snapshot.val().deviceid;
              //                       console.log("Device ID " + deviceId);
              //                       firebase.database().ref("/device/"+deviceId).once("value").then(function(snapshot) {
              //                            console.log(snapshot.val());
              //                            userId = snapshot.val().userID;
              //                            console.log(userId);

                                   //  console.log(userId);
                                     /*
                                     snapshot.forEach(userSnapshot => {
                                         nkey = userSnapshot.key;
                                         btime = userSnapshot.val().btime;
                                         etime = userSnapshot.val().etime;
                                         deviceId = userSnapshot.val().deviceid;


                                     })
                                     */
                              //        var tinfo = btime;
                              //        if (btime != etime)
                              //        {
                              //            tinfo = btime + " <--> " + etime;
                              //        }
                                      // find userid
                              //        var data ;
                            //          getUserInfo(deviceId, function (err, result) {
                            //             data = result;
                            //             console.log(result);
                            //             console.log(result[1]);
                          //               console.log(data[0]);
                          //               console.log(data[1]);
                          //               tinfo = timereport(data,btime,etime,key);
                        //                 if (runfirst > 0) {
                              //             if( botReplyFlexmessage("30a05d2350824d778e0bc255d5cfec2d",tinfo,data[0])==false)
                            //               {
                                             // console.log("Push " + userId);
                                             // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                          //                }
                        //                }

                      //                console.log("lcount " + lcount);
                    //                  if (lcount == lengthofrecord)
                  //                    {
                //                         console.log("finish ");
              //                        }
            //                          });
          //                       }); // find userId


        //                     }));

      //       }

    //      }

        })

        if (lcount >= (lengthofrecord))
        {
           console.log("finish ");
      //     runfirst=1;
        }

     });
    //  runfirst ++;
   }
}
function showallInfo(data,replyToken) {
//  var data = [uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense,uinfo.Name,uinfo.LastName,uinfo.DeviceID];
// var data = [uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense,uinfo.Name,uinfo.LastName,uinfo.deviceID,uinfo.lplate_prov,uinfo.Engine_No,uinfo.Insurance,uinfo.Balance];

console.log(data);
console.log(data[0]);
let myJSON = JSON.stringify({
  type: "bubble",
  hero: {
    type: "image",
    url: "https://carinsurance-5556.web.app/card.jpg",
    size: "full",
    aspectRatio: "20:13",
    aspectMode: "cover",
    action: {
      type: "uri",
      uri: "http://linecorp.com/"
    }
  },
  body: {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: "Device Information",
        weight: "bold",
        gravity: "center",
        align: "center",
        size: "xl"
      },
      {
        type: "box",
        layout: "vertical",
        margin: "lg",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: data[6] + " " +data[7],
                wrap: true,
                size: "md",
                color: "#666666",
                align: "end",
                weight: "bold",
                flex: 4
              }
            ]
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: data[1] + " " + data[2] + " (" + data[3] +") \n" + data[4] + " " + data[9] ,
                wrap: true,
                color: "#666666",
                size: "sm",
                align: "end",
                flex: 4
              }
            ]
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "Device ID ",
                color: "#aaaaaa",
                size: "xs",
                flex: 1
              },
              {
                type: "text",
                text: data[8],
                color: "#666666",
                size: "xs",
                weight: "bold",
                align: "end"
              }
            ]
          },
          {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                      {
                        type: "text",
                        text: "หมายเลขเครื่องยนต์ ",
                        color: "#aaaaaa",
                        size: "xs",
                        flex: 1
                      },
                      {
                        type: "text",
                        text: ""+data[10],
                        color: "#666666",
                        size: "xs",
                        weight: "bold",
                        align: "end"
                      }
                    ]
          }
          ,
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "หมายเลขกรมธรรม์ ",
                color: "#aaaaaa",
                size: "xs",
                flex: 1
              },
              {
                type: "text",
                text: ""+data[11],
                color: "#666666",
                size: "xs",
                weight: "bold",
                align: "end"
              }
            ]
          }

        ,
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "เงินคงเหลือ ",
                color: "#aaaaaa",
                size: "xs",
                flex: 1
              },
              {
                type: "text",
                text: ""+data[12] + " บาท",
                color: "#666666",
                size: "xs",
                weight: "bold",
                align: "end"
              }
            ]
          }
        ]
      },
      {
        type: "box",
        layout: "vertical",
        margin: "xxl",
        contents: [
          {
            type: "separator",
            margin: "xxl"
          }
        ]
      },
      {
        type: "box",
        layout: "vertical",
        margin: "xxl",
        contents: [

          {
            type: "text",
            text: "เมืองไทยประกันภัย",
            weight: "bold",
            color: "#104c71",
            size: "xl",
            align: "center"
          },
          {
            type: "spacer"
          }
        ]
      }
    ]
  }
});
if( botReplyFlexmessage(replyToken,myJSON,data[0])==false)
{
// console.log("Push " + userId);
// botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
}
return myJSON;
}
function timereporton(data,btime,etime,key) {
  // {uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense};
  var total  =  caldistanc_TimeReport(btime,etime,data[5]);
  let report = JSON.stringify({
      type: "bubble",
      styles: {
        footer: {
          separator: true
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เมืองไทยประกันภัย",

            weight: "bold",
            color: "#104c71",
            size: "xl"
          },
          {
            type: "text",
            text: data[1] + " " + data[2] + " (" + data[3] + ") \n" + data[4] + " " +data[9],
            weight: "bold",
            wrap: true,
            size: "xs",
            margin: "md"
          },
          {
            type: "text",
            text: key,
            size: "xs",
            color: "#aaaaaa",
            wrap: true
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: btime,
                    size: "xl",
                    color: "#555555",
                    align: "center"
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "|",
                    size: "xl",
                    color: "#555555",
                    align : "center"

                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "-ON-",
                    size: "xl",
                    color: "#48c220",
                    align : "center"

                  }
                ]
              },
              {
                type: "separator",
                margin: "xxl"
              }
            ]
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "THANK YOU ",
                size: "xs",
                color: "#aaaaaa",
                flex: 0
              },
              {
                type: "text",
                text: "#" +  Date.now(),
                color: "#aaaaaa",
                size: "xs",
                align: "end"
              }
            ]
          }
        ]
      }

  });
    return report;
}

function timereport(data,btime,etime,key) {
  // {uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense};
  var total  =  caldistanc_TimeReport(btime,etime,data[5]);
  let report = JSON.stringify({
      type: "bubble",
      styles: {
        footer: {
          separator: true
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เมืองไทยประกันภัย",

            weight: "bold",
            color: "#104c71",
            size: "xl"
          },
          {
            type: "text",
            text: data[1] + " " + data[2] + " (" + data[3] + ") \n" + data[4] + " " +data[9],
            weight: "bold",
            wrap: true,
            size: "xs",
            margin: "md"
          },
          {
            type: "text",
            text: key,
            size: "xs",
            color: "#aaaaaa",
            wrap: true
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: btime,
                    size: "xl",
                    color: "#555555",
                    align: "center"
                  }
                ]
              },
                        {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "|",
                    size: "xl",
                    color: "#555555",
                    align : "center"

                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: etime,
                    size: "xl",
                    color: "#555555",
                    align : "center"

                  }
                ]
              },
              {
                type: "separator",
                margin: "xxl"
              },

              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ระยะเวลา",
                    size: "sm",
                    color: "#555555"
                  },
                  {
                    type: "text",
                    text: total[0],
                    size: "xs",
                    color: "#111111",
                    align: "end"
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "เป็นเงิน",
                    size: "md",
                    color: "#555555"
                  },
                  {
                    type: "text",
                    text: total[1] +  " บาท",
                    size: "md",
                    color: "#111111",
                    align: "end"
                  }
                ]
              }
            ]
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "THANK YOU ",
                size: "xs",
                color: "#aaaaaa",
                flex: 0
              },
              {
                type: "text",
                text: "#" +  Date.now(),
                color: "#aaaaaa",
                size: "xs",
                align: "end"
              }
            ]
          }
        ]
      }

  });
    return report;
}

function sendrequestnotify(deviceID,replyToken) {
  var ref = firebase.database().ref(deviceID+"/"+date_today());

    ref.limitToLast(1).once('child_added',function(snapshot) {

            console.log("normal " + snapshot.val());
            var nkey ;
            var btime ;
            var etime ;
            var deviceId ="";
            var userId = "";
            var key = "";
            console.log(`snapshot : ${ snapshot.key }`);
            key = snapshot.key;

            btime = snapshot.val().btime;
            etime = snapshot.val().etime;
            deviceId = snapshot.val().deviceid;
            console.log("Device ID normal " + deviceId);
            firebase.database().ref("/device/"+deviceId).once("value").then(function(snapshot) {
                 console.log(snapshot.val());
                 userId = snapshot.val().userID;
                 console.log(userId);

          //  console.log(userId);
            /*
            snapshot.forEach(userSnapshot => {
                nkey = userSnapshot.key;
                btime = userSnapshot.val().btime;
                etime = userSnapshot.val().etime;
                deviceId = userSnapshot.val().deviceid;


            })
            */
             var tinfo = btime;
             if (btime != etime)
             {
                 tinfo = btime + " <--> " + etime;
             }
             // find userid

             var data ;
             getUserInfo(deviceID, function (err, result) {
                data = result;
                console.log(result);
                console.log(result[1]);
                console.log(data[0]);
                console.log(data[1]);
                tinfo = timereport(data,btime,etime,key);
                if( botReplyFlexmessage(replyToken,tinfo,data[0])==false)
                {
                 // console.log("Push " + userId);
                 // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
                }

             }); // find userId
              console.log("User ID " + userId);
          /*
           getReplyToken(deviceId, function (err, result) {
              userId = result;
              console.log("User ID " + userId);
           });
          */
           //console.log("User ID 2 " + userId);

      //     if( botReplyFlexmessage(replyToken," ###### time start car insurance --> " + tinfo + "######",userId)==false)
      //     {
            // console.log("Push " + userId);
            // botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
    //       }

            //  botsendmessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );
          //    bot.pushTextMessage(userId,  " ###### time start car insurance --> " + tinfo + "######" );




       }); // find deviceID


    }); // ref limit


}
function download(data,userID,replyToken) {

  const QRReader = require('qrcode-reader');
  const fs = require('fs');
  const jimp = require('jimp');
/*
  fs.writeFile(__dirname+'/tmp/S__8462346.jpg', data, function (err) {
    if (err) {
        return console.log(err);
    }
  });
*/
  run().catch(error => console.error(error.stack));
  async function run() {

    //var ImageParser = require("image-parser");
    //var img = new ImageParser(data);
  //  var myBuffer = new Buffer(data, 'base64');

//  const img = await jimp.read(fs.readFileSync(__dirname+'/tmp/S__8462346.jpg'));

  const img = await jimp.read(data);

  console.log(img);
  const qr = new QRReader();

  // qrcode-reader's API doesn't support promises, so wrap it
  const value = await new Promise((resolve, reject) => {
    qr.callback = (err, v) => err != null ? reject(err) : resolve(v);
    qr.decode(img.bitmap);
  });

  // { result: 'http://asyncawait.net',
  //   points:
  //     [ FinderPattern {
  //         x: 68.5,
  //         y: 252,
  //         count: 10,
  // ...
  console.log(value);


  // http://asyncawait.net
  console.log(value.result);
    if (value.result.toString().length==15)
    {
      var deviceID = "" + value.result;
      var saveCID = db.ref().child('/users/' + userID );

      saveCID.set({"userID":userID, "deviceID":deviceID,"replyToken":replyToken});

      // set device detail

      saveCID = db.ref().child('/device/' + deviceID );

      db.ref().child('/device/' + deviceID ).once('value', function(snapshot) {
          var exists = (snapshot.val() !== null);
          if (exists==false)
          {
            saveCID.set({"userID":userID, "deviceID":deviceID,"replyToken":replyToken,"Name":"Disrupt","LastName":"everything","lplate":"1 กก 1234","expense":0.0011,"Brand":"HONDA","MODEL":"ACCORD 2.4","Year":"2015","Balance":"1000","Engine_No":"xxxxx","Insurance":"xxxxx","lplate_prov":"xxxxx"});
            botReplymessage(replyToken,"set cid OK " + deviceID,userID);
          }
          else
          {
            saveCID.update({"userID":userID, "deviceID":deviceID});
             var   _model = snapshot.val().MODEL;
             var _brand = snapshot.val().Brand;
             var _year  = snapshot.val().Year;
             var _lplate = snapshot.val().lplate;
             var _lplate_prov = snapshot.val().lplate_prov;
             var _name = snapshot.val().Name;
             botReplymessage(replyToken,"set cid OK [" + deviceID +"]"+ " ["+ _brand + " " +_model + " " + _year + " " + _lplate + " " + _lplate_prov + "] " +_name  ,userID);
          }
     });


    //  saveCID.set({"userID":userID, "deviceID":deviceID,"replyToken":replyToken,"Name":"Disrupt","LastName":"everything","lplate":"1 กก 1234","expense":0.0011,"Brand":"HONDA","MODEL":"ACCORD 2.4","Year":"2015"});

    //  botReplymessage(replyToken,"set cid OK " + deviceID,userID)
    }
  }

  console.log(data);
/*
  fs.writeFile("/tmp/"+filename+"."+type,"HELLOOOOOOOOO", function(err) {
      if(err) {
        return console.log(err);
      }
  });

  fs.writeFile("/tmp/"+filename+"."+type, data, function(err) {
      if(err) {
        return console.log(err);
      }
  });
  */
}

function botReplyFlexmessage(replyToken,cmessage,userId)
{
   //console.log(cmessage);
   console.log("Token " + replyToken);
//   cmessage = "abcdefg";
//  let messages = [JSON.parse(cmessage)];
//  let body =  JSON.stringify({
//      messages : messages
//    })
  var flexMessageBuilder = new LINEBot.FlexMessageBuilder(cmessage);
  console.log(flexMessageBuilder);
   bot.replyFlexMessage(replyToken,  flexMessageBuilder).then(() => {
    return true ;
   })
   .catch((err) => {
     console.log(err);
     bot.pushFlexMessage(userId,  flexMessageBuilder);
     return false;
   });

}

function botReplymessage(replyToken,cmessage,userId)
{

   console.log("Token " + replyToken);
//   cmessage = "abcdefg";
   var textMessageBuilder = new LINEBot.TextMessageBuilder(cmessage);
   bot.replyMessage(replyToken,  textMessageBuilder).then(() => {
    return true ;
   })
   .catch((err) => {
     console.log(err);
     botsendmessage(userId,cmessage)
     return false;
   });

}

function botsendmessage(userId,cmessage)
{

  // var textMessageBuilder = new LINEBot.TextMessageBuilder(cmessage);
   bot.pushTextMessage(userId,  cmessage).then(() => {

   })
   .catch((err) => {
     console.log(err);
   });
}
function formatday(day)
{
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var now = new Date().getTime();
  var month = (d.getMonth())+1;
  var year = d.getFullYear();

  if (day < 10)
	{
		day = "0" + day;
	}

  if (month <10)
  {
    month = "0" + month ;
  }

  var xtimeformat = year+ "/" + month + "/" + day  + "-" + months[d.getMonth()] + "-" + (d.getFullYear().toString().substr(2,2));
  return xtimeformat;
}

function testpush(snapshot,_cost)
{
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var txtreport = "Trip->Start        End  duration\n";
  var nkey ;
  var btime ;
  var etime ;
  var rline = [];

  var total ;
  var dline;
  var amount = 0;
  var contents = [];
  var totaldistance = 0;
  var d = new Date();
  var day = d.getDate();

  //   var key = 'contents';
  //  myJSON[key] = []; // empty Array, which you can push() values into
  var count = 0;
    snapshot.forEach(userSnapshot => {

        nkey = userSnapshot.key;
        btime = userSnapshot.val().btime;
        etime = userSnapshot.val().etime;

        var etimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + etime;

        var timeend = new Date(etimeformat).getTime();

        var stimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + btime;

        var timestart = new Date(stimeformat).getTime();

        var distance = timeend - timestart;

        totaldistance+= distance;



    //    txtreport += btime + " | " + etime + " | "  + caldistanc(btime,etime)+"\n";
        total = caldistanc_onReport(btime,etime,_cost);
        dline = btime + " | " + etime + " | "  + total[0] + " | " + total[1] ;

        amount += parseFloat(total[1]);

        if (count > 0)
        {
          contents.push({
                          type: "separator",
                          margin: "sm"
                        });
        }
        count++;
        contents.push({
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: btime ,
              size: "xs",
              color: "#555555",

            },
            {
              type: "text",
              text: total[0],
              size: "xs",
              color: "#555555",
              align: "end"

            }


          ]
       });
       contents.push({
         type: "box",
         layout: "horizontal",
         contents: [


           {
             type: "text",
             text: etime,
             size: "xs",
             color: "#555555",

           },


           {
             type: "text",
             text: total[1]+" บาท",
             size: "md",
             color: "#111111",
             align: "end"
           }
         ]
       });


    })
    contents.push({
                    type: "separator",
                    margin: "xl"
                  });

    // total time
    var txttotaltime = "";
    var result_total_time = convertMS(totaldistance);
    if (result_total_time.hour != 00)
    {
        cunit = " ชม.";
        txttotaltime = result_total_time.hour  + " ชม. ";
    }
    if ( result_total_time.minute > 0 ) {
       txttotaltime += result_total_time.minute + " นาที "  ; //+ cunit;
    }
    if (result_total_time.seconds > 0) {
       txttotaltime += + result_total_time.seconds + " วินาที";
    }
  //  txttotaltime += result_total_time.minute + " นาที " + result_total_time.seconds + " วินาที" ; //+ cunit;


    contents.push({
                                      type: "box",
                                      layout: "horizontal",
                                      contents: [
                                        {
                                          type: "text",
                                          text: "รวมเวลา",
                                          size: "xs",
                                          color: "#555555"
                                        },
                                        {
                                          type: "text",
                                          text: txttotaltime ,
                                          size: "xs",
                                          color: "#111111",
                                          align: "end"
                                        }
                                      ]
    });

    contents.push({
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "เป็นเงิน",
                        size: "md",
                        color: "#555555"
                      },
                      {
                        type: "text",
                        text: amount.toFixed(2) + " บาท",
                        size: "md",
                        color: "#111111",
                        align: "end"
                      }
                    ]
                  });


 return contents;
}

function getDeviceID_Detail(deviceId)
{

  return new Promise(function(resolve, reject) {
        firebase.database().ref("/device/"+deviceId).once("value").then( function(snapshot) {
           var uinfo;
           uinfo = snapshot.val();
           console.log("ตรงนี้ " + snapshot.val());
           if (uinfo!='undefined') {

                resolve(uinfo);
           }
             else
           {
                reject(error);
           }
        });
    });


  //firebase.database().ref("/device/"+deviceId).once("value",function(snapshot) {
   // do some stuff once

  // console.log(uinfo);

   //return uinfo;
//});
  // return uinfo;
}

function onflexReport(snapshot,cDate,deviceId,_cost,_model,_brand,_year,_lplate,data) {

//  var _cost =0.001;
//  var _model = "";
//  var _brand = "";//
//  var _year  = "";
//  var _lplate = "";


  /*
  getDeviceID_Detail(deviceId) // returns a promise

    .then(function(value) {

      console.log("ตรงนั้น " + value);
      _cost = value.expense;
      _model = value.MODEL;
      _brand = value.Brand;
      _year  = value.Year;
      _lplate = value.lplate;

    });

*/



//  var myJSON;


/*
ref.once("value", function(data) {
  // do some stuff once
});
*/



console.log("Cost " + _cost);
console.log("Model "+_model);
  //rline.put("type","buble",);
/*
  var myJSON = {
      type: "bubble",
        styles: {
        footer: {
        separator: true
      }
    },
    body: {
      type: "box",
      layout: "vertical",
      contents:testpush()
    }
  }; // empty Object





 myJSON = JSON.stringify(myJSON);
*/
  let myJSON = JSON.stringify({
      type: "bubble",
      styles: {
        footer: {
          separator: true
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เมืองไทยประกันภัย",
            weight: "bold",
            color: "#104c71",
            size: "xl"
          },
          {
            type: "text",
            text: _brand + " " + _model + " ("+_year + ") \n" + _lplate + " " + data[9] ,
            weight: "bold",
            wrap: true,
            size: "xs",
            margin: "md"
          },
          {
            type: "text",
            text: cDate,
            size: "xs",
            color: "#aaaaaa",
            wrap: true
          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            spacing: "sm",
            contents: testpush(snapshot,_cost)




          },
          {
            type: "separator",
            margin: "xxl"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "THANK YOU ",
                size: "xs",
                color: "#aaaaaa",
                flex: 0
              },
              {
                type: "text",
                text: "#" +Date.now(),
                color: "#aaaaaa",
                size: "xs",
                align: "end"
              }
            ]
          }
        ]
      }


  });
//  console.log(" MY JSON " +myJSON);
  return myJSON;


}
function onreport(snapshot)
{
  var txtreport = "Trip->Start        End  duration\n";
  var nkey ;
  var btime ;
  var etime ;
  snapshot.forEach(userSnapshot => {
      nkey = userSnapshot.key;
      btime = userSnapshot.val().btime;
      etime = userSnapshot.val().etime;
      txtreport += btime + " | " + etime + " | "  + caldistanc(btime,etime)+"\n";
  })

  return txtreport;
}
function date__today() {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var now = new Date().getTime();


  //firebase.database().ref().child('/LottoDraw/' + xtimeformat + "/" + nround);

  var day = d.getDate();
  var month = (d.getMonth()) + 1;
  var year = d.getFullYear();

  if (day < 10) {
    day = "0" + day;
  }

  if (month < 10) {
    month = "0" + month;
  }

  var xtimeformat = year + "-" + month + "-" + day ;



  return xtimeformat;
}
function date_today()
{
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var d = new Date();
	var now = new Date().getTime();


	//firebase.database().ref().child('/LottoDraw/' + xtimeformat + "/" + nround);

	var day = d.getDate();
  var month = (d.getMonth())+1;
  var year = d.getFullYear();

	if (day < 10)
	{
		day = "0" + day;
	}

  if (month <10)
  {
    month = "0" + month ;
  }

	var xtimeformat = year+ "/" + month + "/" + day  + "-" + months[d.getMonth()] + "-" + (d.getFullYear().toString().substr(2,2));



  return xtimeformat;
}


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
function getReplyToken(deviceId,callback)
{
  db.ref("/device/"+deviceId).once("value").then(function(snapshot) {
      // do some stuff once
      var uinfo = snapshot.val();
      var replyToken = uinfo.replyToken;
      callback(null, replyToken);
     //   console.log("User ID " + userId);
   /*
    }, function (error) {
   // error wil be an Object
       callback(error)
   */
 });
}
function getUserId(deviceId,callback)
{

   db.ref("/device/"+deviceId).once("value").then(function(snapshot) {
       // do some stuff once
       var uinfo = snapshot.val();
       var userId = uinfo.userID;
       callback(null, userId);
      //   console.log("User ID " + userId);
    /*
     }, function (error) {
    // error wil be an Object
        callback(error)
    */
  });
}
function getUserInfo(deviceId,callback)
{

     db.ref("/device/"+deviceId).once("value").then(function(snapshot) {
       // do some stuff once
       var uinfo = snapshot.val();
       var data = [uinfo.userID,uinfo.Brand,uinfo.MODEL,uinfo.Year,uinfo.lplate,uinfo.expense,uinfo.Name,uinfo.LastName,uinfo.deviceID,uinfo.lplate_prov,uinfo.Engine_No,uinfo.Insurance,uinfo.Balance];
         callback(null, data);
      //   console.log("User ID " + userId);
    /*
     }, function (error) {
    // error wil be an Object
        callback(error)
    */
  });
}

function getDeviceId(userToken) {

}

function crack_time(snapshot)
{
	var nkey ;
	var btime ;
	var etime ;
	snapshot.forEach(userSnapshot => {

			nkey = userSnapshot.key;
			btime = userSnapshot.val().btime;
			etime = userSnapshot.val().etime;

		})
	  bot.pushTextMessage(userId,  " time run car insurance --> " + etime);
		return [nkey,btime,etime];
}
function caldistanc_TimeReport(btime ,etime,cost_per_sec)
{
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var day = d.getDate();

  if (day < 10)
  {
      day = "0" + day;
  }

  var etimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + etime;

  var timeend = new Date(etimeformat).getTime();

  var stimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + btime;

  var timestart = new Date(stimeformat).getTime();

  var distance = timeend - timestart;

  var resulttime = convertMS(distance);

  var cost_ = ((cost_per_sec * distance)/1000).toFixed(2);


  var cunit = " นาที";
  /*
  distance = ((distance/1000)/60)  ;

  if (distance > 60)
  {
      distance = (distance/60)    ;
      cunit = " ชม."
  }
  */
  distance= "";
  if (resulttime.hour != 00)
  {
      cunit = " ชม.";
      distance = resulttime.hour  + " ชม. ";
  }
  if ( resulttime.minute > 0  ) {
     distance += resulttime.minute + " นาที "  ; //+ cunit;
  }
  if (resulttime.seconds > 0) {
     distance += + resulttime.seconds + " วินาที";
  }

  //distance += resulttime.minute + " นาที " + resulttime.seconds + " วินาที" ; //+ cunit;

  return  [distance , cost_ ];
}
function caldistanc_onReport(btime ,etime,cost_per_sec)
{
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var day = d.getDate();

  if (day < 10)
  {
      day = "0" + day;
  }

  var etimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + etime;

  var timeend = new Date(etimeformat).getTime();

  var stimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + btime;

  var timestart = new Date(stimeformat).getTime();

  var distance = timeend - timestart;

  var resulttime = convertMS(distance);

  var cost_ = ((cost_per_sec * distance)/1000).toFixed(2);


  var cunit = " นาที";
  /*
  distance = ((distance/1000)/60)  ;

  if (distance > 60)
  {
      distance = (distance/60)    ;
      cunit = " ชม."
  }
  */
  distance= "";
  if (resulttime.hour != 00)
  {
      cunit = " ชม.";
      distance = resulttime.hour  + " ชม. ";
  }
  if ( resulttime.minute > 0  ) {
     distance += resulttime.minute + " นาที "  ; //+ cunit;
  }
  if (resulttime.seconds > 0) {
     distance += + resulttime.seconds + " วินาที";
  }
  var hour = resulttime.hour;
  var minute = resulttime.minute;
  var seconds = resulttime.seconds;
  if (hour.toString().length ==1)
  {
      hour= "0" + hour;
  }
  if (minute.toString().length ==1)
  {
      minute= "0" + minute;
  }
  if (seconds.toString().length ==1)
  {
      seconds= "0" + seconds;
  }


  return  [distance , cost_ ];
}

function caldistanc(btime ,etime)
{
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var d = new Date();
  var day = d.getDate();

  if (day < 10)
  {
      day = "0" + day;
  }

  var etimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + etime;

  var timeend = new Date(etimeformat).getTime();

  var stimeformat = months[d.getMonth()] + " " + day + ", " + d.getFullYear() + " " + btime;

  var timestart = new Date(stimeformat).getTime();

  var distance = timeend - timestart;

  var resulttime = convertMS(distance);

  var cost_ = ((0.0011 * distance)/1000).toFixed(2);


  var cunit = " นาที";
  /*
  distance = ((distance/1000)/60)  ;

  if (distance > 60)
  {
      distance = (distance/60)    ;
      cunit = " ชม."
  }
  */
  distance= "";
  if (resulttime.hour != 00)
  {
      cunit = " ชม.";
      distance = resulttime.hour  + ".";
  }
  distance += resulttime.minute + "." + resulttime.seconds + " " + cunit;

  return distance  + " cost " + cost_;
}
function convertMS( milliseconds ) {
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;
    return {
        day: day,
        hour: hour,
        minute: minute,
        seconds: seconds
    };
  }
module.exports = new FirebaseService();
