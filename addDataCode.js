// read database
const fs = require('fs')
const usersString = fs.readFileSync('./database/users.json').toString()
const usersArray = JSON.parse(usersString)

// write database
const usersData = {
    "id": 3,
    "name": "哈哈哈哈",
    "password": "1231"
}
usersArray.push(usersData)
const string = JSON.stringify(usersArray)
fs.writeFileSync('./database/users.json', string)