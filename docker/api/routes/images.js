const express = require('express');
const router = express.Router();
const config = require('config');
const request = require('request');
const watermark = require('./watermark')
let url ="https://"+ config.get('IBMCloud.IBM_ApiKey') +config.get('IBMCloud.IBM_ActionURL');



router.get('/start', function (req, res, next) {

    let imageName;
    for(let i=1;i<=10;i++) {
        imageName = "image" + i;
        invokeImageManipulationOnOpenwhisk(imageName)
            .then( response => {
                console.log(response);
            })
            .catch( error => {
                console.log(error);
            })

    }


});



function invokeImageManipulationOnOpenwhisk(imageName) {
    return new Promise(function (resolve, reject) {
    // watermark.watermarkImage(imageName)
    //     .then(name =>{
    //         console.log(name);
    //         resolve(name);
    //     })
        request({
            url: url + "watermark?blocking=true",
            // url: url + "hello-world1/helloworld?blocking=true",
            method: "POST",
            json: {
                "name": imageName,
            }
        }, function (error, response, body) {
            if(error){
                console.log(error);
                reject(error);
            }else {
                resolve(response);
            }
        });
    });
}


module.exports = router;
