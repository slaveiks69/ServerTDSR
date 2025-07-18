CREATE OR REPLACE FUNCTION users.UpdateFriendRequestStatus(_player_id INT, _possible_friend_id INT, _is_accept_friend_request BOOLEAN)
    RETURNS VOID
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
BEGIN
    DELETE FROM users.friends_requests WHERE player_id = _player_id AND possible_friend_id = _possible_friend_id;

    IF _is_accept_friend_request = false THEN
        RETURN;
    END IF;

    INSERT INTO users.friends(player_id, friend_id) values (_player_id,_possible_friend_id);

    RETURN;
END;
$$;