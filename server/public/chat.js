$(function () {
    var socket = io.connect('http://localhost:3000');

    var message = $('#message');
    var send_message = $('#send_message');
    var chatroom = $('#chatroom');

    // Envoie un message
    send_message.click(function () {
        socket.emit('new_message', {message: message.val()})
    });

    socket.on("new_message", (data) => {
        console.log(data);
        chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    });

    // Handle user typing..
    message.bind('keypress', () => {
        socket.emit('typing')
    })

    socket.on('typing', (data) => {
        feedback.html("<p><i>" + data.username + " is typing..." + "</i></p>")
    })
});