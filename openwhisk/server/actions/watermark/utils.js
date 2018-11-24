let utils = {};
const config = require('config');
const nano = require('nano')(config.get("DBUrl"));

const cloudantUrl = "https://" + message.username + ":" + message.password + "@" + message.host;
const cloudant = require('cloudant')({url: cloudantUrl});

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
                base64string: image,
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

let message = {
    "url":"https://4099f8c2-831a-48db-81a4-4f4cd0da2edc-bluemix:907bcee3f38819d095c521aa4f01cffa3cf532a88247e17a21fc95d0271f5686@4099f8c2-831a-48db-81a4-4f4cd0da2edc-bluemix.cloudant.com",
    "dbname":"images",
    "query":{
        "selector": {
            "name": "image10"
        },
        "fields": ["_id", "_rev", "name", "data"],
        "limit": 2,
        "skip": 0,
        "execution_stats": true
    },
    "host":"4099f8c2-831a-48db-81a4-4f4cd0da2edc-bluemix.cloudant.com",
    "username":"4099f8c2-831a-48db-81a4-4f4cd0da2edc-bluemix",
    "password":"907bcee3f38819d095c521aa4f01cffa3cf532a88247e17a21fc95d0271f5686"
}

function getCloudantAccount() {
    // full cloudant URL - Cloudant NPM package has issues creating valid URLs
    // when the username contains dashes (common in Bluemix scenarios)
    var cloudantUrl;

    if (message.url) {
        // use bluemix binding
        cloudantUrl = message.url;
    } else {
        if (!message.host) {
            return 'cloudant account host is required.';
        }
        if (!message.username) {
            return 'cloudant account username is required.';
        }
        if (!message.password) {
            return 'cloudant account password is required.';
        }

        cloudantUrl = "https://" + message.username + ":" + message.password + "@" + message.host;

    }
    return require('cloudant')({
        url: cloudantUrl
    });
}


module.exports = utils;