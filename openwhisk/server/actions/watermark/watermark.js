const jimp = require('jimp');
let watermarkImage = __dirname+"/watermark.png";
const utils = require('./utils');
const config = require('config');
const nano = require('nano')(config.get("DBUrl"));


function main(params){
    let filename = params['filename'];
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
                                resolve({name:name});
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

}

module.exports.main=main;
