const express = require('express');
const router = express.Router();
const zip = require('express-zip');
const watermark = require('./watermark');
const grayscale = require('./grayscale');
const enhance = require('./enhance');
const fileZipper = require('./fileZipper');
const fs = require('fs');


router.post('/upload', function (req, res, next) {
    if (!req.body.image) {
        return res.status(400).json({message: 'Please provide an image.'});
    }
    let image = req.body.image;

    getZipForImage(image)
        .then(function (data) {
            let pathOnly = __dirname + '/img/output/';

            res.download(pathOnly+'/'+data+'.zip');
            //res.setHeader('Content-type', 'application/zip');
            /*res.setHeader('Content-disposition', 'attachment; filename=asd.zip');
            return res
                .zip([
                { path: pathOnly+data+'.zip', name: data+'.zip'}
            ])*/
        })
        .catch(function (error) {
            return next(error);
        });

});


function getZipForImage(base64image) {

    let imageBuffer = decodeBase64Image(base64image);
    let filename = (Math.round((new Date()).getTime() / 1000)).toString();
    let imageType = imageBuffer.type.match(/\/(.*?)$/)[1];

    let pathOnly = __dirname + '/img/uploaded/';
    let fullPathWoExtension = pathOnly + filename + '.';
    let fullPath = fullPathWoExtension + imageType;

    try {
        return new Promise(function (resolve,reject) {
            fs.writeFile(fullPath, imageBuffer.data, function (err) {
                if (err) {
                    console.error('ERROR:', err);
                }
                console.log('successfully saved ' + filename);
                return watermark.watermarkImage(fullPath, filename, imageType)
                    .then(wimage => {
                        return Promise.all([
                            grayscale.grayscaleImage(wimage, filename, imageType),
                            enhance.enhanceImage(wimage, filename, imageType)
                        ]).then(result => {
                            resolve(fileZipper.zipDirectory(filename))
                        })
                    });
            });
        })
    } catch (error) {
        console.error('ERROR:', error);
    }
}

function decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

module.exports = router;
