let watermark = {};
const jimp = require('jimp');
const utils = require('./utils');

watermark.watermarkImage = function (imageName){
    return new Promise(function (resolve, reject) {
            utils
                .getImageAndWatermarkFromDB(imageName)
                .then(doc => {
                    let picture;
                    let wpicture;
                    let filename;
                    for(let x=0;x<doc.length;x++){
                        if(doc[x].imageName === 'watermark'){
                            wpicture = jimp.read(new Buffer(doc[x].imageData.data, 'base64'));
                        }else {
                            picture = jimp.read(new Buffer(doc[x].imageData.data, 'base64'));
                            filename = doc[x].imageName;
                        }
                    }
                    if(picture && wpicture){
                        return Promise
                            .all([picture, wpicture])
                            .then(images => {
                                images[0].composite(images[1], 0, 250);
                                images[0].getBase64(jimp.AUTO, (err, image) => {
                                    if(err){
                                        reject(err);
                                    }
                                    resolve(filename);

                                    // PUSH to kafka
                                    utils.sendToKafka(filename);

                                    // WORKS for testing only push to Kafka

                                    // utils.saveImageToDB(image,filename,"watermark")
                                    //     .then(name =>{
                                    //         utils.sendToKafka(name);
                                    //         resolve(name);
                                    //     })
                                })
                            }).catch(function (e) {
                                reject(e);
                            })
                    }

                })
                .catch( err =>{
                    console.log(err);
                    reject(err);
                })
    })
};








module.exports = watermark;