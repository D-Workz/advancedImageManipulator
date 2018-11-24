const express = require('express');
const router = express.Router();
const config = require('config');
const request = require('request');
const watermark = require('./watermark')
let url ="https://"+ config.get('IBMCloud.IBM_ApiKey') +config.get('IBMCloud.IBM_ActionURL');



router.get('/start', function (req, res, next) {

    invokeImageManipulationOnOpenwhisk()
        .then( response => {
            console.log(response);
        })
        .catch( error => {
            console.log(error);
        })
});



function invokeImageManipulationOnOpenwhisk() {

    watermark.watermarkImage()
        .then(name =>{
            console.log(name);
        })

    // return new Promise(function (resolve, reject) {
    //     request({
    //         url: url + "hello-world1/helloworld?blocking=true",
    //         method: "POST",
    //
    //         json: {
    //             "offset": offset,
    //         }
    //     }, function (error, response, body) {
    //         if(error){
    //             console.log(error);
    //             reject(error);
    //         }else {
    //             resolve(response);
    //         }
    //
    //     });
    //
    // });
}


module.exports = router;
