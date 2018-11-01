let watermark = {};
const jimp = require('jimp');
const utils = require('./utils');
let watermarkImage = __dirname+"/img/watermark.png";
const nano = require('nano')('http://whisk_admin:some_passw0rd@localhost:3002');


watermark.watermarkImage = function (filename){
    return new Promise(function (resolve, reject) {
        let images = nano.use('images');
        images.get(filename).then(imageDoc =>{
            let picture = jimp.read(new Buffer(imageDoc.original.data, 'base64'));
            let wpicture = jimp.read(watermarkImage);
            return Promise
                .all([picture, wpicture])
                .then(images => {
                    images[0].composite(images[1], 0, 250);
                    images[0].getBase64(jimp.AUTO, (err, image) => {
                            if(err){
                                reject(err);
                            }
                            utils.saveImageToDB(image,filename,"watermark")
                            .then(name =>{
                                resolve(name);
                            })
                        })
                }).catch(function (e) {
                    reject(e);
            })
        }).catch( err => {
            let response = {
                status: "404",
                err:err,
                message:"Couldn't find image to watermark, upload an image first."
            };
            reject(response);
        })
    });



};


module.exports = watermark;