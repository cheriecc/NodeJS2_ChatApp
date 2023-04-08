const socket = io()


const $msgForm = document.querySelector('#msg-form')
const $msgFormInput = $msgForm.querySelector('input')
const $msgFormButton = $msgForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $msgs = document.querySelector('#msgs')
const $sidebar = document.querySelector('#sidebar')

// Templates
const msgTemplate = document.querySelector('#msg-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoScroll = () => {
    const $newMsg = $msgs.lastElementChild

    // Get last msg's location
    const newMsgstyles = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgstyles.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

    // Get user's vision
    const visibleHeight = $msgs.offsetHeight

    // Get the container's height
    const containerHeight = $msgs.scrollHeight

    // Get the current scrolled height made by the user. scrollTop的意思是目前user视野中的高处
    const scrollOffset = $msgs.scrollTop + visibleHeight

    // When the user does not scroll up, then automatically show the latest msg to user
    if (containerHeight - newMsgHeight <= scrollOffset) {
        // to make sure the latest msg is within user's vision
        $msgs.scrollTop = $msgs.scrollHeight
    }
}


// When the server sends 'message' back to users, render the message on user's page
socket.on('message', (msg) => {
    console.log(msg.text)
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        msg: msg.text,
        createAt: moment(msg.createAt).format('HH:mm A')
    })
    $msgs.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// When the server send 'location' back to users, render the location on user's page
socket.on('location', (url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createAt: moment(url.createAt).format('HH:mm A')
    })
    $msgs.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// When the server send 'room' and 'user list' back to users, render the info on user's page
socket.on('roomData', ({ room, users }) => {
    console.log(room, users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})


// When the user sends out a message to the server
$msgForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // Disable the button once submit msg
    $msgFormButton.setAttribute('disabled', 'disabled')

    /* const msg = document.querySelector('input').value */
    const msg = e.target.elements.message.value

    // receive the message from server, and callback server to acknowledge the recepient
    socket.emit('sendMessage', msg, (error) => {
        // remove disable once msg sent
        $msgFormButton.removeAttribute('disabled')
        $msgFormInput.value = ''
        $msgFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

// When the user sends location to the server
$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared successfully')
        })
        $locationButton.removeAttribute('disabled')
    })
})

// Allow the user to join specific room
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
    
})

// First example
/*
socket.on('countUpdated', (count) => {
    console.log('the count has been updated', count)
})

document.querySelector('#increment').addEventListener('click', () => {
    console.log('Clicked')
    socket.emit('increment')
})
*/