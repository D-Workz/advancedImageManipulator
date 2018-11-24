let utils = {};
const config = require('config');

const cloudantUrl = "https://" + config.get('cloudant.username') + ":" + config.get('cloudant.password') + "@" + config.get('cloudant.host');
const cloudant = require('@cloudant/cloudant')({url: cloudantUrl});
let cloudantDb = cloudant.use(config.get('cloudant.dbName'));



utils.saveImageToDB = function(image, filename, type) {
    return new Promise(function (resolve, reject) {
        cloudantDb.insert({name:"watermark", data:"data:image/png;base64,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"},'watermark')
            .then(data =>{
                console.log(data)
            })
            .catch(err=>{
                console.log(err);
            })



            let noOfTries = 0;
            updateDocument(filename, image, type, noOfTries)
                .then(imageName => {
                    resolve(imageName);
                })
                .catch(err => {
                    console.log("Couldnt update document.");
                    reject(err);
                })

    });
};



utils.getImageAndWatermarkFromDB = function(imageName) {
    return Promise.all([
        this.getImageFromDB(imageName),
        this.getImageFromDB('watermark')
    ]);
}


utils.getImageFromDB = function(imageName) {
    return new Promise(function (resolve, reject) {
        cloudantDb
            .get(imageName)
            .then(doc => {
                let imageBase64;
                if(imageName==='watermark'){
                    imageBase64 = decodeBase64Image(doc.data);
                }else{
                    imageBase64 = decodeBase64Image(doc.data.original);
                }
                // console.log(doc)
                resolve({
                    imageData:imageBase64,
                    imageName:imageName
                });
            })
            .catch( err =>{
                // console.log(err);
                reject(err);
            })

    })
}



function updateDocument(documentName, image, type, noOfTries) {
    let imageBase64 = decodeBase64Image(image);
    let fileType = imageBase64.type.match(/\/(.*?)$/)[1];
    return new Promise(function (resolve, reject) {
        cloudantDb.get(documentName).then(imageDoc => {
            imageDoc[type] = {
                // base64string: image,
                type: imageBase64.type,
                data: imageBase64.data,
                fileType: fileType
            };
            cloudantDb.insert(imageDoc, documentName,
                function (error, response) {
                    if (!error) {
                        console.log("Successfully saved " + type + " image in DB");
                        resolve(documentName);
                    } else {
                        if(noOfTries<=5){
                            noOfTries++;
                            console.log("("+noOfTries+"/5) Trying to update document again.");
                            setTimeout(function(){
                                updateDocument(documentName,image,type, noOfTries)
                                    .then(imageName => {
                                        resolve(imageName);
                                    })
                                    .catch(err => {
                                        //TODO check better recursions only supports one time fail update
                                        console.log("Couldnt update document.");
                                        reject(err);
                                    })
                            }, 100);
                        }else {
                            console.error("("+noOfTries+"/5) Stop trying.", error);
                            reject(error);
                        }
                    }
                });
        }).catch(err => {
            console.error("Couldnt get document (image)", err);
            reject(err);
        });
    });
}



function decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = matches[2];
    return response;
}


module.exports = utils;