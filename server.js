const express = require('express');
const path = require('path');
const app = express();
const amplitude = require('@amplitude/analytics-node');
const axios = require('axios');
bodyParser = require('body-parser');
const uuid = require('uuid'); // Import the uuid library
const AWS = require('aws-sdk');
const multer = require('multer');
const app = express();
const cors = require('cors'); // Import the cors middleware
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
});

const s3 = new AWS.S3();

app.get('/api/get-upload-url', (req, res) => {
    const fileName = req.query.fileName;
    const fileType = req.query.fileType;

    const s3Params = {
        Bucket: 'wityysaver',
        Key: `${Date.now()}-${fileName}`,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }
        const returnData = {
            signedRequest: data,
            url: `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`
        };
        res.json(returnData);
    });
});

app.get('/api/list-images', (req, res) => {
    const s3Params = {
        Bucket: 'wityysaver',
        Prefix: ''
    };

    s3.listObjectsV2(s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }
        const images = data.Contents
            .filter(item => item.Key.match(/\.(jpg|jpeg|png|gif)$/i))
            .map(item => `https://${s3Params.Bucket}.s3.amazonaws.com/${item.Key}`);
        res.json(images);
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});