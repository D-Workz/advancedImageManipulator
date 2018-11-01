let grayscale = {};
const jimp = require('jimp');
const utils = require('./utils');
const nano = require('nano')('http://whisk_admin:some_passw0rd@localhost:3002');


grayscale.grayscaleImage = function (filename){
    return new Promise(function (resolve, reject) {
        let images = nano.use('images');
        images.get(filename)
            .then(imageDoc =>{
            jimp.read(new Buffer(imageDoc.watermark.data, 'base64'))
                .then( dbImage => {
                    dbImage
                        .greyscale()
                        .getBase64(jimp.AUTO, (err, image) => {
                            if(err){
                                reject(err);
                            }
                            utils.saveImageToDB(image,filename,"greyscale")
                                .then(name =>{
                                    resolve(name);
                                })
                        })
                }).catch(err => {
                console.error("Couldnt read Image", err);
                reject(err);
            })
        }).catch( err => {
            console.error("Couldnt get image form DB", err);
            reject(err);
        })

    });
};


module.exports = grayscale;