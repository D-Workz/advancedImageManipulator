let enhance = {};
const jimp = require('jimp');
const utils = require('./utils');
const nano = require('nano')('http://whisk_admin:some_passw0rd@localhost:3002');



enhance.enhanceImage = function (filename){
    return new Promise(function (resolve, reject) {
        let images = nano.use('images');
        images.get(filename).then(imageDoc =>{
            jimp.read(new Buffer(imageDoc.watermark.data, 'base64'))
                .then( dbImage => {
                    dbImage
                        .contrast(0.5)
                        .brightness(0.5)
                        .getBase64(jimp.AUTO, (err, image) => {
                        if(err){
                            reject(err);
                        }
                        utils.saveImageToDB(image,filename,"enhance")
                            .then(name =>{
                                resolve(name);
                            })
                    })
                }).catch(err => {
                    console.error("Couldnt read Image", err);
                    reject(err);
                })



        }).catch( err => {
            let response = {
                status: "404",
                err:err,
                message:"Couldn't find image to enhance, upload an image first."
            };
            reject(response);
        })
    });
};


module.exports = enhance;