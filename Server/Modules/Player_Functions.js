module.exports = {
    GetUser: function (db, player, is_join, socket) {
        if (player.player_id == "")
            player.player_id = null;

        console.log('player.player_id' + player.player_id);

        db.any(`SELECT * FROM users.getuser(${player.player_id}, ${is_join});`)
            .then(data => {
                var json_object = data[0].getuser;

                //console.log(json_object)

                if (json_object != null) {
                    player.player_id = json_object.player_uuid;

                    player.username = json_object.username;
                    player.mail = json_object.mail;

                    player.money = json_object.money;
                    player.gems = json_object.gems;

                    player.privilege_id = json_object.privilege_id;
                }
            })
            .catch(error => console.log('Database error', error))
            .then(() => socket.emit('username_init', player));
    },
    SetUsername: function (db, data, player, socket) {
        db.any(`SELECT * FROM users.setusername(${player.player_id}, '${data.username}');`)
            .then(dbdata => {
                var json_object = dbdata[0].setusername;

                console.log(player, json_object)

                if (json_object?.errors) {
                    console.error('errors:', json_object.errors);
                    // ЕСЛИ ID НЕ СУЩЕСТВУЕТ ОШИБКА ВЫДАЕТЬСЯ!!!
                    socket.emit('username_not_agree');
                    return 0;
                }
                else {
                    player.username = json_object.username;
                    return 1;
                }
            })
            .catch(error => console.log('Database error', error))
            .then(send => { if (send == 1) socket.emit('username_init', player) });
    },
    GetFriends: function (db, player, socket) {
        db.any(`SELECT * FROM users.getfriends(${player.player_id});`)
            .then(data => {
                console.log('GetFriends');
                socket.emit('friend_list', { 'list': data[0].getfriends.list });
            })
            .catch(error => console.log('Database error', error));
    },
    GetFriendsRequest: function (db, player, socket) {
        db.any(`SELECT * FROM users.getfriendsrequest(${player.player_id});`)
            .then(data => {
                socket.emit('request_friend_list', { 'list': data[0].getfriendsrequest.list });
            })
            .catch(error => console.log('Database error', error));
    },
    DeclineFriendRequest: function (db, data) {
        db.any(`SELECT * FROM users.updatefriendrequeststatus(${data.user_id}, ${player.player_id}, false);`)
            .then(dbdata => {})
            .catch(error => console.log('Database error', error));
    },
    SearchUser: function (db, data, socket) {
        db.any(`SELECT * FROM users.searchuser('${data.username}');`)
            .then(dbdata => {
                console.log(`SearchUser ${data.username}`);

                socket.emit('search_friend_list', { 'list': dbdata[0].searchuser.list });
            })
            .catch(error => console.log('Database error', error));
    },
    PingMyStatus: function (db, player, io, status, players) {
        db.any(`SELECT * FROM users.getfriends(${player.player_id}, 'online');`)
            .then(data => {
                var json_objects = data[0].getfriends.list;

                console.log('getfriends.list.online: ' + json_objects)

                if (json_objects != null) {
                    json_objects.forEach(friend => {
                        if (players.List[friend.username] == undefined) return;

                        io.to(players.List[friend.username].id).emit('ping_from_friend',
                            {
                                'username': player.username,
                                'status': status
                            }
                        );
                    });
                }
            })
            .catch(error => console.log('Database error', error));
    },
    AddFriend: function (db, player, data, io, players) {
        db.any(`SELECT * FROM users.addfriend(${player.player_id}, ${data.user_id});`)
            .then(dbdata => {
                var json_object = dbdata[0].addfriend;

                console.log(json_object)

                if (json_object?.errors) {
                    console.error('errors:', json_object.errors);
                    return 0;
                }
                else {
                    return 1;
                }
            })
            .catch(error => console.log('Database error', error))
            .then(send => { 
                if (send == 1) {
                    if (players.List[data.username] == undefined) return;

                    io.to(players.List[data.username].id).emit('request_friend_list_update');
                }
            });
    },
    AcceptFriendRequest: function (db, player, data, socket, io, players) {
        db.any(`SELECT * FROM users.updatefriendrequeststatus(${data.user_id}, ${player.player_id}, true);`)
            .then(dbdata => {
                socket.emit('friend_list_update');

                if (players.List[data.username] == undefined) return;

                io.to(players.List[data.username].id).emit('friend_list_update');
            })
            .catch(error => console.log('Database error', error));
    }
};