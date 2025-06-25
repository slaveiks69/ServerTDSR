
const sqlite3 = require('sqlite3');
var pFunc = require('./Modules/Player_Functions.js');
var Player = require('./Modules/Player.js');

var port = 7777;

var io = require('socket.io')(process.env.PORT || port);

console.log(io)

var players = {};

let db = new sqlite3.Database("server-data.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log("Error Occurred - " + err.message);
    }
    else {
        console.log("DataBase Connected");
    }
})


console.log('Start server');

function PingMyStatus(db, player, io, status) {
    db.all(`select Friend.id, User.id as 'user_id', User.username, User.status from Friend 
            inner join User 
            on Friend.user1 == User.id or Friend.user2 == User.id 
            where (Friend.user1 == ${player.player_id} or Friend.user2 == ${player.player_id}) 
            and (username != '${player.username}') and (status == 'online')`, (err, rows) => {
        if (rows == undefined) return;
        if (rows.length > 0) {
            rows.forEach(function (row) {
                console.log(players[row.username]);
                if (players[row.username] == undefined) return;
                console.log('players[row.username]');
                io.to(players[row.username].id).emit('ping_from_friend',
                    {
                        'username': player.username,
                        'status': status
                    }
                );
            });
        }
    });
}


function AddFriend(db, player, data, io) {
    db.exec(`insert into FriendRequest(user1, user2) values(${player.player_id}, ${data.user_id})`, () => {
        if (players[data.username] == undefined) return;
        io.to(players[data.username].id).emit('request_friend_list_update');
    });
}

function AcceptFriendRequest(db, player, data, socket, io) {
    db.exec(`delete from FriendRequest where id = ${data.id}`);

    db.exec(`insert into Friend(user1, user2) values(${data.user_id}, ${player.player_id})`, () => {
        socket.emit('friend_list_update');

        if (players[data.username] == undefined) return;
        io.to(players[data.username].id).emit('friend_list_update');
    });
}

io.on('connection', function (socket) {

    var player = new Player();

    player.id = socket.id;

    socket.emit('init', player);

    console.log("connected player: " + player.id);

    socket.on('init_confirmed', function (data) {
        player.player_id = data.player_id;

        pFunc.SetStatus(db, player, 'online', socket);
    });

    socket.on('past_init', function (data) {
        console.log(`${data.username}`);
        if (data.username == "") {
            players[data.id] = player;
        }
        else {
            players[data.username] = player;
            console.log(players[data.username]);
        }
        PingMyStatus(db, player, io, 'online');
    });

    socket.on('username_set', function (data) {
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
        AcceptFriendRequest(db, player, data, socket, io);
    });

    socket.on('decline_friend_request', function (data) {
        pFunc.DeclineFriendRequest(db, data);
    });

    socket.on('search_friend', function (data) {
        pFunc.SearchUser(db, data, socket);
    });

    socket.on('add_friend', function (data) {
        AddFriend(db, player, data, io);
    });

    socket.on('invite_friend', function (invite) {
        console.log(`${invite.where_username} invite friend ${invite.to_username} to ${invite.photon_room}`);

        if (players[invite.to_username] == undefined) return;

        io.to(players[invite.to_username].id).emit('invite_friend',
            {
                'where_username': invite.where_username,
                'to_username': invite.to_username,
                'photon_room': invite.photon_room
            }
        );
    });

    socket.on('invite_decline', function (invite) {
        console.log(`${invite.to_username} decline invite ${invite.where_username}`);

        if (players[invite.where_username] == undefined) return;

        io.to(players[invite.where_username].id).emit('invite_decline',
            {
                'where_username': invite.where_username,
                'to_username': invite.to_username,
                'photon_room': invite.photon_room
            }
        );
    });

    socket.on('disconnect', function () {
        PingMyStatus(db, player, io, 'offline');

        socket.broadcast.emit('disconnected', player);

        if (players[player.username] != null) {
            delete players[player.username];
        }

        pFunc.SetStatus(db, player, 'offline', socket);
        console.log("disconnected player: " + player.username);
    });

});

