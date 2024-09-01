const express = require('express');
const path = require('path');

const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 5053;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly set AWS credentials from environment variables
const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
};

if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    console.error('AWS credentials are missing. Please check your .env file.');
    process.exit(1);
}
AWS.config.update(awsConfig);

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

// Catch-all route to serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
});