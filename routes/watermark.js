let watermark = {};
const jimp = require('jimp');
let watermarkImage = __dirname+"/img/watermark.png";

watermark.watermarkImage = function (image, filename, imageType){
    let picture = jimp.read(image);
    let wpicture = jimp.read(watermarkImage);
    // let folder = filename;
    filename = filename.concat('-watermark.').concat(imageType);
    return Promise
        .all([picture, wpicture])
        .then(images => {
            console.log("successfully saved "+ filename);
        return images[0]
            .composite(images[1], 0, 250)
            // .write(__dirname+"/img/output/"+folder+"/"+filename);

    }).catch(function (e) {
      console.log(e);
    })
};


module.exports = watermark;