CREATE OR REPLACE FUNCTION users.AddFriend(_player_id uuid, _possible_friend_id uuid)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF EXISTS(SELECT 1 FROM users.friends_requests WHERE possible_friend_uuid = _possible_friend_id AND player_uuid = _player_id)
           OR
       EXISTS(SELECT 1 FROM users.friends_requests WHERE possible_friend_uuid = _player_id AND player_uuid = _possible_friend_id)
       THEN
        RETURN core.errmessage(_errcode := 'exists.friends_request', _msg := NULL, _detail := NULL);
    END IF;

    INSERT INTO users.friends_requests(player_uuid, possible_friend_uuid) VALUES (_player_id, _possible_friend_id);
    RETURN NULL;
END;
$$;