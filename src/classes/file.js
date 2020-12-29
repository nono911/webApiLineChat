/* eslint-disable no-console */
const { admin } = require('../config/firebase');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const uniqueFilename = require('unique-filename')
const { base64encode, base64decode } = require('nodejs-base64');
const moment = require('moment');



const Files = {
    uploadImage: (req, res) => {
        console.info({ "function": "/files/uploadImage", "data": { "message": req} });

        if (req.method !== 'POST') {
            return res.status(405).end();
        }
        const busboy = new Busboy({headers: req.headers});
        const tmpdir = os.tmpdir();
        const fields = {};
        const uploads = {};
        let imageUrl = {};
        let roomId = {};

        busboy.on('field', (fieldname, val) => {
            console.log(`Processed field ${fieldname}: ${val}.`);
            fields[fieldname] = val;
            if (fieldname == "room_id"){
                roomId = val.trim();
                console.log({ "function": "/files/uploadImage", "data": { "roomId": roomId} });
            }
        });

        const fileWrites = [];

        busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            console.log(`Processed file ${filename}`);
            let ext = require('path').extname(filename);
            let path = 'images/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
            console.log({ "function": "/files/uploadImage", "data": { "path": path} });
            let newFileName = uniqueFilename('');
            console.log("newFileName = "+newFileName);
            let contentType = mimetype;
            let data = [];
            const bucketRef = admin.storage().bucket('gs://lineoa-c2e7a.appspot.com/');
            console.log(path + newFileName);
            
            const bucketFile = bucketRef.file(path + newFileName + ext);
            file.on('error', (err) => {
                console.error({ "function": "/files/uploadImage", "data": { "message": "Save image error", "requestId": requestId, "error": JSON.stringify(err) } });
            });
            file.on('data', (chunk) => {
                if (fieldname == "file"){
                    data.push(chunk);
                    
                }
            });
        
            file.on('end', async () => {
                if (fieldname == "file"){
                    let buf = Buffer.concat(data);
                    await bucketFile.save(buf, { contentType: contentType })
                    let imageUrls = await bucketFile.getSignedUrl({ action: 'read', expires: '12-31-2099' });
                    console.log(imageUrls);
                    console.log(roomId);
                    let date = new Date().getTime();
                    let encodedImageUrl = base64encode(imageUrls[0]);
                    // let wrapImageUrl = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/files/image?imageUrl=" + encodedImageUrl + "&roomId=" + roomId + "&timestamp=" + timestamp + "&sourceName=" + "line" ;
                    let wrapImageUrl = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/files/image?imageUrl=" + encodedImageUrl + "&roomId=" + roomId;
                    
                    // res.send({url: wrapImageUrl});
                    res.send({url: imageUrls[0]});
                }
            });
        });

        busboy.on('finish', () => {
            console.log('Finish');
            console.info({ "function": "/files/uploadImage", "data": { "message": "finish"} });
        });

        busboy.end(req.rawBody);
    },
    uploadVideo: (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).end();
        }
        const busboy = new Busboy({headers: req.headers});
        const tmpdir = os.tmpdir();
        const fields = {};
        const uploads = {};
        let videoUrl = {};
        let roomId = {};

        busboy.on('field', (fieldname, val) => {
            // console.log(`Processed field ${fieldname}: ${val}.`);
            fields[fieldname] = val;
            if (fieldname == "room_id"){
                roomId = val.trim();
            }
        });

        const fileWrites = [];

        busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            // console.log(`Processed file ${filename}`);
            let ext = require('path').extname(filename);
            let path = 'images/messages/' + moment().year() + '/' + moment().month() + '/' + roomId + '/';
            let newFileName = uniqueFilename('');
            // console.log("newFileName = "+newFileName);
            let contentType = mimetype;
            let data = [];
            const bucketRef = admin.storage().bucket('gs://lineoa-c2e7a.appspot.com/');
            // console.log(path + newFileName);
            
            const bucketFile = bucketRef.file(path + newFileName + ext);
            file.on('error', (err) => {
                console.error({ "function": "/files/uploadVideo", "data": { "message": "Save video error", "requestId": requestId, "error": JSON.stringify(err) } });
            });
            file.on('data', (chunk) => {
                if (fieldname == "file"){
                    data.push(chunk);
                }
            });
        
            file.on('end', async () => {
                if (fieldname == "file"){
                    let buf = Buffer.concat(data);
                    await bucketFile.save(buf, { contentType: contentType })
                    let videoUrls = await bucketFile.getSignedUrl({ action: 'read', expires: '12-31-2099' });
                    // console.log(videoUrls);
                    // console.log(roomId);
                    let date = new Date().getTime();
                    let encodedVideoUrl = base64encode(videoUrls[0]);
                    // let wrapVideoUrl = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/files/video?imageUrl=" + encodedVideoUrl + "&roomId=" + roomId + "&timestamp=" + timestamp + "&sourceName=" + "line" ;
                    let wrapVideoUrl = "https://us-central1-functions-movefast.cloudfunctions.net/api/v1/files/video?imageUrl=" + encodedVideoUrl + "&roomId=" + roomId;
                    
                    // res.send({url: wrapVideoUrl});
                    res.send({url: videoUrls[0]});
                }
            });
        });

        busboy.on('finish', () => {
            // console.log('Finish');
        });

        busboy.end(req.rawBody);
    }
}

module.exports = {
    Files
}



