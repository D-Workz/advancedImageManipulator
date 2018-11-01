const express = require('express');
const router = express.Router();
const zip = require('express-zip');
const watermark = require('./watermark');
const grayscale = require('./grayscale');
const utils = require('./utils');
const enhance = require('./enhance');
const fileZipper = require('./fileZipper');
const fs = require('fs');
const nano = require('nano')('http://whisk_admin:some_passw0rd@localhost:3002');


router.post('/upload', function (req, res, next) {
    if (!req.body.image) {
        return res.status(400).json({message: 'Please provide an image.'});
    }
    let image = req.body.image;

    return initDBsaveImage(image)
        .then(imageName => {
            return watermark.watermarkImage(imageName)
                .then(wimage => {
                    return Promise.all([
                        grayscale.grayscaleImage(wimage),
                        enhance.enhanceImage(wimage)
                    ]).then(result => {
                        if(result[1] === result[0]){
                            console.log("All image types saved.");
                            let filename = result[0];
                            (fileZipper.getZippedImages(filename)).then(zip =>{
                                zip.pipe(res);
                                res.setHeader('Content-disposition', 'attachment; filename=' + filename + '.zip');
                                zip.finalize();
                            }).catch(err =>{
                                if(err.status === 404){
                                    return res.status(404).json({message:err.message});
                                }else {
                                    return res.status(500).json({message:"Unknown error."});
                                }
                            })
                        }
                    }).catch(err =>{
                        if(err.status === 404){
                            return res.status(404).json({message:err.message});
                        }else {
                            return res.status(500).json({message:"Unknown error."});
                        }
                    })
            }).catch(err => {
                if(err.status === 404){
                    return res.status(404).json({message:err.message});
                }else {
                    return res.status(500).json({message:"Unknown error."});
                }
            });
    })






    // getZipForImage(image)
    //     .then(function (data) {
    //         let pathOnly = __dirname + '/img/output/';
    //
    //         res.download(pathOnly+'/'+data+'.zip');
    //         //res.setHeader('Content-type', 'application/zip');
    //         /*res.setHeader('Content-disposition', 'attachment; filename=asd.zip');
    //         return res
    //             .zip([
    //             { path: pathOnly+data+'.zip', name: data+'.zip'}
    //         ])*/
    //     })
    //     .catch(function (error) {
    //         return next(error);
    //     });

});

function initDBsaveImage(image) {
    return new Promise(function (resolve, reject) {
        initCouchDB()
            .then(response => {
                if (response) {
                    let filename = (Math.round((new Date()).getTime() / 1000)).toString();
                    utils.saveImageToDB(image, filename, "original")
                        .then(name => {
                            resolve(name);
                        })
                        .catch(err => {
                            reject(err);
                        })

                }
            })
    });
}

function initCouchDB() {
    return new Promise(function (resolve, reject) {
        nano.db.list().then((body) => {
            body.forEach((db) => {
                if(db !== "images"){
                    nano.db.create('images')
                        .then(resp =>{
                            console.log("DB created ", resp);
                            resolve(true);
                        })
                        . catch(err =>{
                            console.error("DB error ", err);
                            reject(false);
                        })
                }else{
                    console.log("DB existed.");
                    resolve(true);
                }
            });
        });
    });
}

function getZipForImage(base64image) {

    let imageBuffer = decodeBase64Image(base64image);
    let filename = (Math.round((new Date()).getTime() / 1000)).toString();


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



module.exports = router;
