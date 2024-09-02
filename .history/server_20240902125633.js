const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// AWS Configuration
const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
};

if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    console.error('AWS credentials are missing. Please check your .env file.');
    process.exit(1);
}

// AWS.config.update(awsConfig);
// const s3 = new AWS.S3();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/aws-image-gallery.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'aws-image-gallery.html'));
});

app.post('/imageUpload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.uploadedFileName;
    const fileName = `${Date.now()}-${uploadedFile.name}`;

    const params = {
        Bucket: 'wityysaver',
        Key: fileName,
        Body: uploadedFile.data,
    };


     // Upload post image to S3
     try {
     if (req.files['post_image']) {
        const postImageFile = req.files['post_image'][0];
        const postImageParams = {
          Bucket: 'wityysaver',
          Key: `applogo/${uuid.v4()}_${postImageFile.originalname}`,
          Body: fs.createReadStream(postImageFile.path),
        };
        const postImageUploadResult = await s3.upload(postImageParams).promise();

        console.log(`===== >>>post image upload result ${postImageUploadResult.Location}`);
        console.log(`===== >>>post image upload result ${postImageUploadResult.Key}`);


        res.send({
            "response_code": 200,
            "response_message": "Success",
            "response_data": postImageUploadResult
        });
    }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            "response_code": 500,
            "response_message": "Error",
            "response_data": err
        });
    }
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