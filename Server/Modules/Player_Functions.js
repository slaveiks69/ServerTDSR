module.exports = {
    SetStatus: function (db, player, status, socket) {
        db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
            if (rows.length > 0) {
                db.exec(`update User set status = '${status}' WHERE id == '${player.player_id}'`);

                console.log(`username_init ${player.player_id} ${rows[0].mail}`);
                player.username = rows[0].username;
                player.mail = rows[0].mail;
                socket.emit('username_init', player);

                console.log(`player ${player.player_id} get status ${status}`);
            }
            else if (rows.length == 0) {
                var sql = `insert into User (status) values('${status}')`;

                db.run(sql, function (err) {
                    if (err) {
                        console.log(err.message);
                    }

                    player.player_id = this.lastID;

                    db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
                        if (rows.length > 0) {
                            console.log(`username_init ${player.player_id}`);
                            player.username = rows[0].username;
                            console.log(rows[0].username);
                            socket.emit('username_init', player);
                        }
                    });

                    console.log(`create new user with ID: ${player.player_id}`);
                });
            }
        });
        //console.log(player.id + " " +player.username);
        //return new Promise((resolve, reject) => resolve(player));
    },
    SetUsername: function (db, data, player, socket) {
        db.all(`select * from User where username == ?`, data.username, (err, rows) => {
            if (rows.length == 0) {
                db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
                    if (rows.length > 0) {
                        db.exec(`update User set username = '${data.username}' WHERE id == '${player.player_id}'`);
                        player.username = data.username;
                        socket.emit('username_init', player);
                    }
                });
            }
            else {
                socket.emit('username_not_agree');
            }
        });
    },
    GetFriends: function (db, player, socket) {
        db.all(`select Friend.id, User.id as 'user_id', User.username, User.status from Friend 
                inner join User 
                on Friend.user1 == User.id or Friend.user2 == User.id 
                where (Friend.user1 == ${player.player_id} or Friend.user2 == ${player.player_id}) 
                and (username != '${player.username}')`, (err, rows) => {
            if (rows.length > 0) {
                socket.emit('friend_list', { 'list': rows });
            }
        });
    },
    GetFriendsRequest: function (db, player, socket) {
        db.all(`select FriendRequest.id, User.id as 'user_id', User.username, User.status from FriendRequest 
                inner join User 
                on FriendRequest.user1 == User.id 
                where FriendRequest.user2 == ${player.player_id}`, (err, rows) => {
            if (rows.length > 0) {
                socket.emit('request_friend_list', { 'list': rows });
            }
        });
    },
    DeclineFriendRequest: function (db, data) {
        db.exec(`delete from FriendRequest where id = ${data.id}`);
    },
    SearchUser: function (db, data, socket) {
        db.all(`select id as 'id', id as 'user_id', username, status from User where username = '${data.username}'`, (err, rows) => {
            if (rows.length > 0) {
                socket.emit('search_friend_list', { 'list': rows });
            }
        });
    },
    PingMyStatus: function (db, player, io, status, players) {
        db.all(`select Friend.id, User.id as 'user_id', User.username, User.status from Friend 
            inner join User 
            on Friend.user1 == User.id or Friend.user2 == User.id 
            where (Friend.user1 == ${player.player_id} or Friend.user2 == ${player.player_id}) 
            and (username != '${player.username}') and (status == 'online')`, (err, rows) => {
            if (rows == undefined) return;
            if (rows.length > 0) {
                rows.forEach(function (row) {
                    console.log(players.List[row.username]);
                    if (players.List[row.username] == undefined) return;
                    console.log('players[row.username]');
                    io.to(players.List[row.username].id).emit('ping_from_friend',
                        {
                            'username': player.username,
                            'status': status
                        }
                    );
                });
            }
        });
    },
    AddFriend: function (db, player, data, io, players) {
        db.exec(`insert into FriendRequest(user1, user2) values(${player.player_id}, ${data.user_id})`, () => {
            if (players.List[data.username] == undefined) return;
            io.to(players.List[data.username].id).emit('request_friend_list_update');
        });
    },
    AcceptFriendRequest: function (db, player, data, socket, io, players) {
        db.exec(`delete from FriendRequest where id = ${data.id}`);
    
        db.exec(`insert into Friend(user1, user2) values(${data.user_id}, ${player.player_id})`, () => {
            socket.emit('friend_list_update');
    
            if (players.List[data.username] == undefined) return;
            io.to(players.List[data.username].id).emit('friend_list_update');
        });
    }
};