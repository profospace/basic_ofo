const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();
const fileUpload = require('express-fileupload');

app.use(fileUpload());


var AWS = require('aws-sdk');

const PORT = process.env.PORT || 1005;
const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:1007'); // Replace with your frontend URL if different
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

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

app.get('/aws-image-gallery.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'aws-image-gallery.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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



app.post('/imageUpload', async (req, res) => {
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key ID
        secretAccesskey:  process.env.AWS_SECRET_ACCESS_KEY, // Secret access key
        region:  'ap-south-1'
    })


    const s3 = new AWS.S3();
    const fileContent  = Buffer.from(req.files.uploadedFileName.data, 'binary');
    const params = {
        Bucket: 'wityysaver',
        Key: `${Date.now()}-${fileName}`,
        Body: fileContent 
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        res.send({
            "response_code": 200,
            "response_message": "Success",
            "response_data": data
        });
    });

})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message,
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});