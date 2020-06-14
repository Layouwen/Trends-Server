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
    // 读取 session 文件,转化为对象
    const session = JSON.parse(fs.readFileSync('./session.json').toString())

    if (path === '/sign_in' && method === 'POST') {
        // 读数据库
        let userArray = JSON.parse(fs.readFileSync('./database/users.json'))
        const array = []
        // 每次接受数据就添加进数组
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            // 转化字符串
            const string = Buffer.concat(array).toString()
            // 在转化为对象
            const obj = JSON.parse(string)
            // 找到符合的 user
            const user = userArray.find(user => user.name === obj.name && user.password === obj.password) // 成功返回符合的对象，失败返回undefined
            if (user === undefined) { // 失败
                response.statusCode = 400
                response.setHeader('content-Type', 'text/JSON; charset=UTF-8')
                response.end(`{"errorCode":4001}`)
            } else { // 成功
                response.statusCode = 200
                // 设置 Cookie
                const random = Math.random()
                session[random] = {
                    user_id: user.id
                }
                // 写入数据
                fs.writeFileSync('./session.json', JSON.stringify(session))
                response.setHeader("Set-Cookie", `'session_id=${random}; HttpOnly'`)
                response.end()
            }
        })
    } else if (path === '/home.html') {
        // 获取 Cookie
        const cookie = request.headers['cookie']
        let sessionId
        try { // 读取 Cookie 中的 id 值
            sessionId = cookie.split(';').filter(s => s.indexOf('session_id=') >= 0)[0].split('=')[1]
        } catch (error) {}
        if (sessionId && session[sessionId]) {
            // 从 session 中读取对应的值
            const userId = session[sessionId].user_id
            // 读数据库
            let userArray = JSON.parse(fs.readFileSync('./database/users.json'))
            // 找到符合的 user
            let user = userArray.find(user => user.id === userId)
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            let string
            if (user) {
                string = homeHtml.replace('{{loginStatus}}', '已登录').replace('{{user.name}}', user.name)
                response.write(string)
            }
        } else {
            // 读取源文件内容
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            // 替换文字
            const string = homeHtml.replace('{{loginStatus}}', '未登录').replace('{{user.name}}', '')
            response.write(string)
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
        })
        response.end()
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