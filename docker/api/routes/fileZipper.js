const fs = require('fs');
const archiver = require('archiver');
let fileZipper = {};
const nano = require('nano')('http://whisk_admin:some_passw0rd@localhost:3002');
const base64Img = require('base64-img');

fileZipper.getZippedImages = function (filename) {
    return new Promise(function (resolve, reject) {
        let images = nano.use('images');
        images.get(filename)
            .then(imageDoc =>{
                if(imageDoc.greyscale && imageDoc.enhance){
                    let zip = archiver('zip', {
                        zlib: {level: 9} // Sets the compression level.
                    });



                    zip.on('close', function () {
                        console.log(zip.pointer() + ' total bytes');
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                    });

                    zip.on('end', function () {
                        console.log('Data has been drained');
                    });

                    zip.on('warning', function(err) {
                        if (err.code === 'ENOENT') {
                            // log warning
                        } else {
                            // throw error
                            throw err;
                        }
                    });

                    zip.on('error', function(err) {
                        reject(err);
                        throw err;

                    });
                    let greyscaleBuffer = new Buffer(imageDoc.greyscale.data, 'base64');
                    let enhanceBuffer = new Buffer(imageDoc.enhance.data, 'base64');
                    greyscaleBuffer = Buffer.from(greyscaleBuffer);
                    enhanceBuffer = Buffer.from(enhanceBuffer);
                    zip.append(greyscaleBuffer, {name: "greyscale"});
                    zip.append(enhanceBuffer, {name: "enhance"});
                    resolve(zip);

                }else{
                    let response = {
                        status: "404",
                        err:"Images not found.",
                        message:"Couldn't find all images, upload an image first."
                    };
                    reject(response);
                }
            })
            .catch( err => {
                let response = {
                    status: "404",
                    err:err,
                    message:"Couldn't find images to zip, upload an image first."
                };
                reject(response);
            });

    });
};


module.exports = fileZipper;