const express = require('express');
const router = express.Router();
const watermark = require('./watermark');
const grayscale = require('./grayscale');
const utils = require('./utils');
const enhance = require('./enhance');
const fileZipper = require('./fileZipper');
const fs = require('fs');
const config = require('config');
const nano = require('nano')(config.get("DBUrl"));


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
                                // zip.pipe(res);
                                res.setHeader('Content-disposition', 'attachment; filename=' + filename + '.zip');
                                return res.attachment(zip);
                                // zip.finalize();
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
    let dbExists = false;
    return new Promise(function (resolve, reject) {
        nano.db.list().then((body) => {
            body.forEach((db) => {
                if(db === "images"){
                    dbExists = true;
                }
            });
            if(!dbExists){
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
}




module.exports = router;
