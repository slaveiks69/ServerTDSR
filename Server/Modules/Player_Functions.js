module.exports = {
    SetStatus: function (db, player, status, socket) {
        db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
            if(rows.length > 0)
            {
                db.exec(`update User set status = '${status}' WHERE id == '${player.player_id}'`);
                
                console.log(`username_init ${player.player_id} ${rows[0].mail}`);
                player.username = rows[0].username;
                player.mail = rows[0].mail;
                socket.emit('username_init', player);

                console.log(`player ${player.player_id} get status ${status}`);
            }
            else if(rows.length == 0)
            {
                var sql = `insert into User (status) values('${status}')`; 

                db.run(sql, function(err) {  
                    if (err) {  
                        console.log(err.message);  
                    }  
                    
                    player.player_id = this.lastID;

                    db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
                        if(rows.length > 0)
                        {
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
    PingMyStatus: function (db, player, io, status) {
        db.all(`select Friend.id, User.id as 'user_id', User.username, User.status from Friend 
                inner join User 
                on Friend.user1 == User.id or Friend.user2 == User.id 
                where (Friend.user1 == ${player.player_id} or Friend.user2 == ${player.player_id}) 
                and (username != '${player.username}') and (status == 'online')`, (err, rows) => {
            if(rows == undefined) return;
            if(rows.length > 0)
            {
                rows.forEach(function (row) {
                    console.log(players[row.username]);
                    if(players[row.username] == undefined) return;
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
    },
    SetUsername: function (db, data, player, socket) {
        db.all(`select * from User where username == ?`, data.username, (err, rows) => {
            if(rows.length == 0)
            {
                db.all(`select * from User where id == ?`, player.player_id, (err, rows) => {
                    if(rows.length > 0)
                    {
                        db.exec(`update User set username = '${data.username}' WHERE id == '${player.player_id}'`);
                        player.username = data.username;
                        socket.emit('username_init', player);
                    }
                });
            }
        });
    },
    GetFriends: function (db, player, socket) {
        db.all(`select Friend.id, User.id as 'user_id', User.username, User.status from Friend 
                inner join User 
                on Friend.user1 == User.id or Friend.user2 == User.id 
                where (Friend.user1 == ${player.player_id} or Friend.user2 == ${player.player_id}) 
                and (username != '${player.username}')`, (err, rows) => {
            if(rows.length > 0)
            {
                socket.emit('friend_list', { 'list': rows });
            }
        });
    }
};