const jimp = require('jimp');
const utils = require('./utils');
const config = require('config');

const nano = require('nano')(config.get("DBUrl"));


function main(params){
    let filename = params['filename'];
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
                                    resolve({name:name});
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
                message:"Couldn't find image to greyscale, upload an image first."
            };
            reject(response);
        })

    });
}

module.exports.main=main;