var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    formidable = require('formidable'),
    readChunk = require('read-chunk'),
    fileType = require('file-type'),
    sharp = require('sharp'),
    Promise = require('promise'),
    multer = require('multer');

var bucketName = "authdemo-f7863.appspot.com";


var app = express();

app.set('port', (process.env.PORT || 5000));

// Tell express to serve static files from the following directories
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() +
    path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {fileSize: 12000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('image');



/**
 * Index route
 */
app.get('/', function (req, res) {
    // Don't bother about this :)
    var filesPath = path.join(__dirname, 'uploads/');
    fs.readdir(filesPath, function (err, files) {
        if (err) {
            console.log(err);
            return;
        } else {
          files.forEach(function (file) {
              fs.stat(filesPath + file, function (err, stats) {
                  if (err) {
                      console.log(err);
                      return;
                  }

                  var createdAt = Date.parse(stats.ctime),
                      hours = Math.round((Date.now() - createdAt) / (1000*60*60));

                  if (hours > 1) {
                      fs.unlinkSync(filesPath + file);
                  }
              });
          });
        }
    });

    res.sendFile(path.join(__dirname, 'views/index.html'));
});

/**
 * Upload photos route.
 */
app.post('/upload_photos', function (req, res) {
  var photos = [];
  upload(req, res, function(err){
    if(req.file.filename != undefined) {
      var filename = `${req.file.filename}`;
      console.log("Image Path: " + filename);
      // Start of the image compression function

      var dataPromise = compressImage(filename);
      dataPromise.then(function(result){
            console.log("Promised Result: ", result);
            if(result){
              // Start of image upload session
              var uploadPromise = uploadPic(bucketName, filename);
              uploadPromise.then(function(file){
                console.log("Upload is resolved");
                if(file != null){
                  var imageURL = `https://storage.cloud.google.com/${bucketName}/${'profile/' + filename}`;
                  console.log(imageURL);
                } else {
                  console.log("Upload process is not ok! ");

                }

              }, function(err){
                  console.log("Upload process is not successful! ", err);
              });
            } else {
              console.log("Compression result is null!");
            }
          }, function(err){
            console.log("Conversion is not successful! ", err);
          });
    }

    photos.push({
        status: true,
        filename: filename,
        imageURL: 'uploads/' + filename
    });

    res.status(200).json(photos);
    console.log("Sending json", photos);

  });

});

app.listen(app.get('port'), function() {
    console.log('Express started at port ' + app.get('port'));
});





function checkFileType(file, cb){
  // allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  //check extenstion
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}


function compressImage(file) {
  // Return promise
  return new Promise(function(resolve, reject){
    sharp("./uploads/" + file)
    .rotate()
    .resize(200, 320)
    .toFile("./uploads/images/" + file, function(err, data){
      if(err){
        reject(err);
      } else {
        resolve(data);  // image has been converted.
      }
    });
  });
}

function uploadPic(bucketName, filename) {
  // [START storage_upload_file]
  // Imports the Google Cloud client library
  const {Storage} = require('@google-cloud/storage');

  // Creates a client
  const storage = new Storage({
    projectId: "authdemo-f7863",
    keyFilename: "admin-sdk.json"
  });
  // const storage = new Storage();
  var filedir = "uploads/images/" + filename;
  // var filedir = file.path;

  var options = {
  destination: 'profile/' + filename,
  resumable: true,
  validation: 'crc32c',
  metadata: {
    metadata: {
      event: 'Fall trip to the zoo'
      }
    }
  };

  return new Promise(function(resolve, reject) {
    storage.bucket(bucketName).upload(filedir, options, function(err, file) {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        if(err){
          console.log("Error: Upload is not ok!");
          reject(err);
        } else {
          // deleteTempImage(filename);
          resolve(file);
        }
    });
  });

}

// Asyncronous deletion
// function deleteTempImage(file) {
//   // Multered Image Deletion
//   try {
//     fs.unlinkSync("./public/" + file);  // After Upload is done, it will delete temp photo.
//     console.log("Successfully deleted multered image.");
//   } catch (err) {
//     console.log("Can't delete multered file!");
//   }
//   // Converted Image Deletion
//   try {
//     fs.unlinkSync("./public/images/" + file);  // After Upload is done, it will delete temp photo.
//     console.log("Successfully deleted compressed image .");
//   } catch (err) {
//     console.log("Can't delete compressed file!");
//   }
// }
