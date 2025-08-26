var pFunc = require('./Modules/Player_Functions.js');
var Players = require('./Modules/Players.js');
var Player = require('./Modules/Player.js');

var port = 7777;

var io = require('socket.io')(process.env.PORT || port);

var players = new Players();

const pgp = require('pg-promise')();

const db = pgp({
    user: 'service',
    host: 'localhost',
    database: 'topdownshooter',
    password: 'sperma',
    port: 5432
});

db.any('SELECT NOW()')
  .then(data => console.log('Database connect', data[0].now))
  .catch(error => console.log('Database error', error));

console.log('Start server');

io.on('connection', function (socket) {
    var player = new Player();

    player.id = socket.id;

    socket.emit('init', player);

    console.log("connected player: " + player.id);

    socket.on('init_confirmed', function (data) {
        player.player_id = data.player_id;

        pFunc.GetUser(db, player, true, socket);
    });

    socket.on('past_init', function (data) {
        console.log(`username: ${data.username}`);
        if (data.username == "") {
            players.List[data.id] = player;
        }
        else {
            if(players.List[player.id] != undefined)
                delete players.List[player.id];
            players.List[data.username] = player;
            console.log(players.List[data.username]);
        }
        //console.log(players);
        pFunc.PingMyStatus(db, player, io, 'online', players);
    });

    socket.on('username_set', function (data) {
        console.log(data);
        console.log(`set username ${data.player_id} ${data.username}`);

        pFunc.SetUsername(db, data, player, socket);
    });

    socket.on('get_friend_list', function () {
        pFunc.GetFriends(db, player, socket);
    });

    socket.on('get_request_friend_list', function () {
        pFunc.GetFriendsRequest(db, player, socket);
    });

    socket.on('accept_friend_request', function (data) {
        pFunc.AcceptFriendRequest(db, player, data, socket, io, players);
    });

    socket.on('decline_friend_request', function (data) {
        pFunc.DeclineFriendRequest(db, data);
    });

    socket.on('search_friend', function (data) {
        pFunc.SearchUser(db, data, socket);
    });

    socket.on('add_friend', function (data) {
        pFunc.AddFriend(db, player, data, io, players);
    });

    socket.on('invite_friend', function (invite) {
        console.log(`${invite.where_username} invite friend ${invite.to_username} to ${invite.photon_room}`);

        if (players.List[invite.to_username] == undefined) return;

        io.to(players.List[invite.to_username].id).emit('invite_friend',
            {
                'where_username': invite.where_username,
                'to_username': invite.to_username,
                'photon_room': invite.photon_room
            }
        );
    });

    socket.on('invite_decline', function (invite) {
        console.log(`${invite.to_username} decline invite ${invite.where_username}`);

        if (players.List[invite.where_username] == undefined) return;

        io.to(players.List[invite.where_username].id).emit('invite_decline',
            {
                'where_username': invite.where_username,
                'to_username': invite.to_username,
                'photon_room': invite.photon_room
            }
        );
    });



    socket.on('add_money', function (data) {
        console.log(data);
        console.log(`add money ${data.player_id} ${data.money}`);

        pFunc.AddMoney(db, player, data.money, socket);
    });


    
    socket.on('disconnect', function () {
        pFunc.PingMyStatus(db, player, io, 'offline', players);

        socket.broadcast.emit('disconnected', player);

        if (players.List[player.username] != null) {
            delete players.List[player.username];
        }

        pFunc.GetUser(db, player, false, socket);
        console.log("disconnected player: " + player.username);
    });

});



//httpServer.listen(port, '0.0.0.0');