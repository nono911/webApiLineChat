/* eslint-disable */
const {admin} = require('../config/firebase');
const {check, validationResult} = require('express-validator');

const middlewares = {
    checkAuthenticated: async (req, res, next) => {
        let decodedIdToken;
        if (!req.headers.authorization){ return res.status(401).send({ errors: "Access Denied. No authorization header received." }); }
        token = req.headers.authorization;
        if (token.indexOf('Bearer') !== -1){
            try{
                decodedIdToken = await admin.auth().verifyIdToken(token.split('Bearer ')[1]);
                req.user_id = decodedIdToken.uid;
            } catch (error) {
                console.error({ "function": "/middlewares/checkAuthenticated", "data": { "error": error } });
                return res.status(401).json({ errors: "Access Denied. ID token is expire." });
            }
        } else{
            console.error({ "function": "/middlewares/checkAuthenticated", "data": { "error": "Access Denied. Invalid header authentication format" } });
            return res.status(401).send({ errors: "Access Denied. Invalid header authentication format." });
        }
        next();
    },
    checkValidationResult: (req, res, next) => {
        // Finds the validation errors in this request and wraps them in an object with handy functions
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        next();
    },
}

module.exports = {
    middlewares
}
