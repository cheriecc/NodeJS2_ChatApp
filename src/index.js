const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMsg, generateLocationUrl } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0


// server(emit) -> client(receive) -> acknowledgement -> countUpdate
// client(emit) -> server(receive) -> acknowledgement -> increment

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMsg('Admin', 'Welcome'))
        // When a new user join
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} just joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    // When a user send a message
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMsg(user.username, msg))
        callback()
    })

    // When a user send location
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location', generateLocationUrl(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    // When a user get disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMsg(user.username, `${user.username} just left ${user.room}`))
        }
    })

})

server.listen(port, () => {
    console.log('Server is running on port ' + port + ' successfully!')
})




/*
io.on('connection', (socket) => {
    console.log('New Websocket connection')
    socket.emit('countUpdated', count)
    socket.on('increment', () => {
        count++
        // This is for the specific connection
        // socket.emit('countUpdated', count)
        // This is for every single connection
        io.emit('countUpdated', count)
    })
})
*/