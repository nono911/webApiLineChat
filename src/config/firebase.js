const admin = require('firebase-admin');
var serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lineoa-c2e7a.firebaseio.com",
});

exports.admin = admin;