const fs = require('fs');
const archiver = require('archiver');
let fileZipper = {};


fileZipper.zipDirectory = function (directory) {
    return new Promise(function (resolve, reject) {


    // let output = fs.createWriteStream(workingDir + directory + '.zip');


    let archive = archiver('zip', {
        zlib: {level: 9} // Sets the compression level.
    });

    archive.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    archive.on('end', function () {
        console.log('Data has been drained');


    });

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    archive.on('error', function(err) {
        throw err;
    });
    let obj = {
        directory:directory,
        archive:archive
    };
        resolve(obj);



    });
};


module.exports = fileZipper;