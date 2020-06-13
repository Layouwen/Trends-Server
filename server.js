var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请输入指定端口。如：\nnode server.js 8888')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
    }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** main start ************/

    response.statusCode = 200
    let content
    // setting index
    const filePath = path === '/' ? '/index.html' : path
    // judge type
    const index = filePath.lastIndexOf('.')
    const suffix = filePath.substring(index)
    const fileType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    }
    response.setHeader('Content-Type', `${fileType[suffix] || "text/html"};charset=utf-8`)
    try {
        content = fs.readFileSync(`./public${filePath}`)
    } catch (error) {
        content = '文件路径不存在'
        response.statusCode = 404
    }
    response.write(content)
    response.end()

    /******** main end ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功！请输入下列地址访问\nhttp://localhost:' + port)