const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
    region: process.env.AWS_REGION
});

const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        const S3 = new AWS.S3({
            apiVersion: '2006-03-01'
        });

        const uploadParams = {
            ACL: "public-read",
            Bucket: "functionup-93",
            Key: "userPorfile/" + file.originalname,
            Body: file.buffer
        }

        S3.upload(uploadParams, (error, dataRes) => {
            if (error) {
                reject(error);
            }
            resolve(dataRes.Location)
        });
    });
}

module.exports = {
    uploadFile
}