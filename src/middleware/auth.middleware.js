
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)

}

const authenticate = function (req, res, next) {
    try {

        const bearerToken = req.headers.authorization;
        if (!bearerToken) return res.status(404).send({ status: false, msg: "token must be present" });
        const token = bearerToken.split(" ")[1];


        let decodedToken = jwt.verify(token, "group17project");
        if (!decodedToken) return res.status(400).send({ status: false, msg: "invalid token" })
        req.decodedToken = decodedToken// dont't want to kill request means still want to use decoded token
        next()
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

const authorisation = function (req, res, next) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId.trim())) {
            return res.status(400).send({ status: false, message: 'Invalid ID !' });
        }

        let decodedToken = req.decodedToken//syntax need to write in reverse order
        let authorloggedin = decodedToken.userId
        if (userId != authorloggedin) {
            return res.status(400).send({ status: false, msg: "User is UnAuthorised" })
        }
        next()
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}


module.exports.authenticate = authenticate
module.exports.authorisation = authorisation