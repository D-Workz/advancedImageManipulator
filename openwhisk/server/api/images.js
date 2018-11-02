const utils = require('./utils');
const config = require('config');
const openwhisk = require("openwhisk");
const nano = require('nano')(config.get("DBUrl"));

function main(params){
    let response = {
        status:"",
        message:""
    };
    let image = params['image'];
    if (!image) {
        response.status = 400;
        response.message = "Please provide an image.";
        return response;
    }
    return new Promise(function (resolve, reject) {
        initDBsaveImage(image)
            .then (name => {
                let ow = openwhisk({ignore_certs:true});
                    ow.actions
                        .invoke(
                            {name: "watermark", result:true, param:{filename:name}}
                        )
                        .then((result1) => {
                            resolve({res:result1, hans:"hans"});
                        })
                        .catch(err =>{
                            reject({error:err});
                        })
            });
        })

}

module.exports.main=main;


function initDBsaveImage(image) {
    return new Promise(function (resolve, reject) {
        initCouchDB()
            .then(response => {
                if (response) {
                    let filename = (Math.round((new Date()).getTime() / 1000)).toString();
                    utils.saveImageToDB(image, filename, "original")
                        .then(name => {
                            resolve({name:name});
                        })
                        .catch(err => {
                            reject(err);
                        })

                }else{
                    reject({error:"no response from couchdb"});
                }
            })
    });
}


function initCouchDB() {
    let dbExists = false;
    return new Promise(function (resolve, reject) {
        nano.db.list().then((body) => {
            body.forEach((db) => {
                if(db === "images"){
                    dbExists = true;
                }
            });
            if(!dbExists){
                nano.db.create('images')
                    .then(resp =>{
                        console.log("DB created ", resp);
                        resolve(true);
                    })
                    . catch(err =>{
                        console.error("DB error ", err);
                        reject(false);
                    })
            }else{
                console.log("DB existed.");
                resolve(true);
            }

        });
    });
}