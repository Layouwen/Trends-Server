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
    if (path === '/sign_in' && method === 'POST') {
        // read database
        let userArray = JSON.parse(fs.readFileSync('./database/users.json')) // read database
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)

        })
        request.on('end', () => {
            // convert string
            const string = Buffer.concat(array).toString()
            // convert obj
            const obj = JSON.parse(string)
            // find user
            console.log(obj)
            console.log(userArray)
            const user = userArray.find(user => user.name === obj.name && user.password === obj.password) // 成功返回符合的对象，失败返回undefined
            console.log('---------')
            console.log(user)
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('content-Type', 'text/JSON; charset=UTF-8')
                response.end(`{"error":4001}`)
            } else {
                response.statusCode = 200
                // 设置 Cookie
                response.setHeader('set-Cookie', 'logined=1')
                response.end()
            }
        })
    } else if (path === '/home.html') {
        // 获取 Cookie
        const cookie = request.headers['cookie']
        console.log(cookie)
        // 判断 Cookie 是否正确
        if (cookie === 'logined=1') {
            // 读取源文件内容
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            // 替换文字
            const string = homeHtml.replace('{{loginStatus}}', '已登录')
            response.write(string)
            response.end()
        } else {
            // 读取源文件内容
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            // 替换文字
            const string = homeHtml.replace('{{loginStatus}}', '未登录')
            response.write(string)
            response.end()
        }
        response.end()
    } else if (path === '/register' && method === 'POST') {
        response.setHeader('Content-Type', 'text/html; charset=UTF-8')
        // read database
        let userArray = JSON.parse(fs.readFileSync('./database/users.json')) // read database
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)

        })
        request.on('end', () => {
            // convert string
            const string = Buffer.concat(array).toString()
            // convert obj
            const obj = JSON.parse(string)
            // last user id
            const lastUser = userArray[userArray.length - 1]
            // new user
            const newUser = {
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password
            }
            userArray.push(newUser)
            // write data
            fs.writeFileSync('./database/users.json', JSON.stringify(userArray))
            response.end()
        })
    } else {
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
    }

    /******** main end ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功！请输入下列地址访问\nhttp://localhost:' + port)