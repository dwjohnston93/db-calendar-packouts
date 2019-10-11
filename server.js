var http = require('http');
var fs = require('fs');

const PORT=8080; 

fs.readFile('./index.html', function (err, html) {

    if (err) throw err;    

    const requestHandler = (request, response) => {
        console.log(request.url)
        response.end('Hello Node.js Server!')
    }

    http.createServer(function(req, res) {  
        if(req.url = "/"){
            res.writeHeader(200, {"Content-Type": "text/html"});  
            res.write(html);  
            res.end();
        } else if(req.url = "/packout-confirm"){
            res.writeHeader(200, {"Content-Type": "text/html"});  
            res.write('packout-confirm.html');  
            res.end();
        }
          
    }).listen(PORT);
});