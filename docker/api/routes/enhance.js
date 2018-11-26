let enhance = {};
const jimp = require('jimp');
const utils = require('./utils');
const config = require('config');

const cloudantUrl = "https://" + config.get('cloudant.username') + ":" + config.get('cloudant.password') + "@" + config.get('cloudant.host');
const cloudant = require('@cloudant/cloudant')({url: cloudantUrl});
let cloudantDb = cloudant.use(config.get('cloudant.dbName'));

enhance.enhanceImage = function (filename){
    return new Promise(function (resolve, reject) {
        let images = cloudantDb.use('images');
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
                                let topic = config.get('topicName2');
                                utils.sendToKafka(name, topic);
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