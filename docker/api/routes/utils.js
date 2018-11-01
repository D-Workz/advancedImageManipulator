let utils = {};
const config = require('config');
const nano = require('nano')(config.get("DBUrl"));

utils.saveImageToDB = function(image, filename, type) {
    return new Promise(function (resolve, reject) {
        if(type === "original"){
            insertNewDocument(filename, image)
                .then(imageName => {
                    resolve(imageName);
                })
                .catch(err => {
                    console.log("Couldnt insert document");
                    reject(err);
                })
        }else {
            let noOfTries = 0;
            updateDocument(filename, image, type, noOfTries)
                .then(imageName => {
                    resolve(imageName);
                })
                .catch(err => {
                    console.log("Couldnt update document.");
                    reject(err);
                })
        }
    });
};

function updateDocument(documentName, image, type, noOfTries) {
    let images = nano.use('images');
    let imageBase64 = decodeBase64Image(image);
    let fileType = imageBase64.type.match(/\/(.*?)$/)[1];
    return new Promise(function (resolve, reject) {
        images.get(documentName).then(imageDoc => {
            imageDoc[type] = {
                // base64string: image,
                type: imageBase64.type,
                data: imageBase64.data,
                fileType: fileType
            };
            images.insert(imageDoc, documentName,
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


function insertNewDocument(documentName, image) {
    let images = nano.use('images');
    let imageBase64 = decodeBase64Image(image);
    let fileType = imageBase64.type.match(/\/(.*?)$/)[1];
    return new Promise(function (resolve, reject) {
        let imageObj = {};
        imageObj["original"] = {
            base64string: image,
            type: imageBase64.type,
            data: imageBase64.data,
            fileType: fileType
        };
        images.insert(imageObj, documentName)
            .then(resp =>{
                console.log("Successfully saved original image in DB");
                resolve(documentName);
            })
            .catch(err =>{
                console.error("Couldnt save image in DB.", err);
                reject(err);
            })

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