const express = require('express');
const router = express.Router();
const zip = require('express-zip');
const watermark = require('./watermark');
const grayscale = require('./grayscale');
const enhance = require('./enhance');
const fileZipper = require('./fileZipper');
const fs = require('fs');
// const archiver = require('archiver')
// const archive = archiver('zip');


router.post('/upload', function (req, res, next) {
    if (!req.body.image) {
        return res.status(400).json({message: 'Please provide an image.'});
    }
    let image = req.body.image;

    getZipForImage(image)
        .then(function (data) {

            let archive = data.archive;
            let workingDir = __dirname + '/img/output/';
            // archive.pipe(output);

            workingDir = workingDir.concat(data + '/');
            archive.directory(workingDir, false);

            // archive.finalize();


            // let pathOnly = __dirname + '/img/output/';


            // archive.on('error', function(err) {
            //     res.status(500).send({error: err.message});
            // });
            //
            // //on stream closed we can end the request
            // archive.on('end', function() {
            //     console.log('Archive wrote %d bytes', archive.pointer());
            // });

            //set the archive name
            res.attachment('archive-name.zip');

            //this is the streaming magic
            archive.pipe(res);

            // const files = [__dirname + '/files/上午.png', __dirname + '/files/中午.json'];
            //
            // for(const i in files) {
            //     archive.file(files[i], { name: path.basename(files[i]) });
            // }
            //
            archive.finalize();




            // res.setHeader('Content-type', 'application/zip');
            // return res
            //     .zip([
            //     { path: pathOnly+data+'.zip', name: data+'.zip'}
            // ])
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
