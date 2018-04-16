

const http = require('http');
const https = require('https');
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
// const mime = require('mime');

const options = {
//    key : fs.readFileSync(path.join(__dirname, '/server/server.key')),
//    cert: fs.readFileSync(path.join(__dirname, '/server/server.crt')),
      key : fs.readFileSync(path.join(__dirname, '/certs/privkey.pem')),
      cert: fs.readFileSync(path.join(__dirname, '/certs/cert.pem')),

    allowHTTP1 : true,

    /*
    settings : {
        enablePush : true,
        headerTableSize :4096000,
        initialWindowSize : 65535000,
        maxFrameSize : 16384000,
        maxHeaderListSize : 65535000
    },*/
}

//http.createServer(app.callback()).listen(3001);
const h1server = http.createServer(function(req,res){
  // console.log(req.headers);
  console.log("###" + req.url);
  var file;

  if(req.url == "/" || req.url == "index.html") {
    file = http1getFile('/app/index.html')
  } else {
    file = http1getFile(req.url);
  }

  if(file) {
      res.writeHead(200, file.headers);
      res.end(file.data);
  } else {
      res.writeHead(404);
      res.end("Server Error");
  }
}).listen(3000, function() {
  console.log("Welcome! Port : 3000");
});

function http1getFile(reqPath) {
  try{
      const filePath = path.join(__dirname,  reqPath);
//        console.log("try open file - " + filePath);
      const data = fs.readFileSync(filePath);
      const contentType = mime.getType(filePath);
      const stat = fs.statSync(filePath);
      return {
          data : data,
          path : reqPath,
          headers : {
              'content-type' : contentType,
              'content-length' : stat.size, //optional
              'last-modified' : stat.mtime.toUTCString(), //optional
          }
      }
  } catch(e) {
      console.log("error. cannot read file");
      return null;
  }
}
