
const sqlite3 = require('sqlite3');
var pFunc = require('./Modules/Player_Functions.js');
var Player = require('./Modules/Player.js');

var port = 7777;
var io = require('socket.io')(process.env.PORT || port);

var players = [];

let db = new sqlite3.Database("server-data.db", sqlite3.OPEN_READWRITE, (err) => {
    if(err)
    {
        console.log("Error Occurred - " + err.message);
    }
    else
    {
        console.log("DataBase Connected");
    }
})

//select * from Users where mail == 'damn_p@vk.com'

console.log('Start server');

io.on('connection', function (socket) {

    var player = new Player();

    player.id = socket.id;

    socket.emit('init', player);

    console.log("connected player: "+ player.id);

    socket.on('init_confirmed', function (data) {
        player.player_id = data.player_id;
        
        pFunc.SetStatus(db, player, 'online', socket)
            .then((resolve) => { 
                if(resolve.username === "")
                    players[resolve.id] = player;
                else
                    players[resolve.username] = player;
            });
    });

    socket.on('username_set', function (data) {
        console.log(`set username ${data.player_id} ${data.username}`);
 
        pFunc.SetUsername(db, data, player, socket);
    });

    socket.on('get_friend_list', function (data) {
        //console.log(`set username ${data.player_id} ${data.username}`);
 
        pFunc.GetFriends(db, player, socket);
    });

    socket.on('invite_friend', function (friend) {
        //console.log(`set username ${data.player_id} ${data.username}`);
        console.log(`Friend invite ${friend.username}`);

        io.to(players[friend.username].id).emit({'invite': { 'where': player.username }});
        //pFunc.GetFriends(db, player, socket);
    });

    socket.on('disconnect', function () {

        socket.broadcast.emit('disconnected', player);

        if(players[player.username] != null)
        {
            delete players[player.username];
        }
        
        pFunc.SetStatus(db, player, 'offline', socket);
        console.log("disconnected player: "+ player.username);
    });

});

