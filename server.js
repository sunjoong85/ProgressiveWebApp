
const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const options = {
  //Local Test SSL
  /*  key : fs.readFileSync(path.join(__dirname, '/server/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '/server/server.crt')),
*/

 // SSL by let's encrypt
    key : fs.readFileSync(path.join(__dirname, '/certs/privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/certs/fullchain.pem')),
    ca: fs.readFileSync(path.join(__dirname, '/certs/chain.pem')),
    // allowHTTP1 : true
  }

const h1server = http.createServer((req, res) => {
  //HTTP -> HTTPs forwarding
  res.writeHead(301,{Location: 'https://flyingmom.kr'});
  res.end();
}).listen(3000);


const h2server = http2.createSecureServer(options, function(req , res){
  // detects if it is a HTTPS request or HTTP/2. If HTTP/2 is not supported to the requested client, then
  const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ? req.stream.session : req;
  console.log('here' + req.httpVersion);

}).listen(3001);

// file push
function push(stream, reqPath) {
    const file = getFile(reqPath);
    if (!file) {
        console.log("file not found");
        return;
    }

    stream.pushStream({ ':path' : reqPath }, (err, pushStream) => {
        pushStream.respondWithFD(file.fd, file.headers);

        pushStream.once('error', (error) => {
            console.log('Push Error : ' + error.code);
        })
        pushStream.once('frameError', () => {
            console.log('Push Frame Error');
        })

        pushStream.once('close', () => {
            console.log("#pushStream close fd : " + file.fd + " " + file.path);
            fs.closeSync(file.fd)
        });
    });

}

h2server.on('stream', (stream, headers) => {
    const reqPath = headers[':path'] === '/' ? 'index.html' : headers[':path'];
    const file = getFile(reqPath);

    stream.session.state;
    if(reqPath === 'index.html') {

        // index.html을 전달하면서 필요한 자원들을 push합니다. 서버는 무엇을 클라이언트에 전달할지 알고 있어야합니다.
        push(stream, '/app/lib/jquery.js');
        push(stream, '/app/lib/lodash.js');
        push(stream, '/app/lib/bootstrap.min.css');
        push(stream, '/app/lib/bootstrap.min.js');
        push(stream, '/app/lib/app.css');

    } else {
        console.log("another request");
    }

    if(!file) {
        stream.respond({':status' : 404});
        stream.end();
        return;
    }
    stream.respondWithFD(file.fd, file.headers);

    stream.once('close', () => {
        console.log("#stream close fd : " + file.fd + " " + file.path);
        fs.closeSync(file.fd)
    });
});

function getFile(reqPath) {
    const filePath = path.join(__dirname,  reqPath);

    try{
        const fd = fs.openSync(filePath, fs.constants.O_RDONLY);
        const contentType = mime.getType(filePath);
        const stat = fs.statSync(filePath);
        return {
            fd : fd,
            path : reqPath,
            headers : {
                'content-type' : contentType,
                'content-length' : stat.size, //optional
                'last-modified' : stat.mtime.toUTCString(), //optional
            }
        }
    } catch(e) {
        console.log("error. cannot read file - " + filePath);
        return null;
    }
}
