CREATE OR REPLACE FUNCTION users.UpdateFriendRequestStatus(_player_id uuid, _possible_friend_id uuid, _is_accept_friend_request BOOLEAN)
    RETURNS VOID
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
BEGIN
    DELETE FROM users.friends_requests WHERE player_uuid = _player_id AND possible_friend_uuid = _possible_friend_id;

    IF _is_accept_friend_request = false THEN
        RETURN;
    END IF;

    INSERT INTO users.friends(player_uuid, friend_uuid) values (_player_id,_possible_friend_id) ON CONFLICT DO NOTHING;

    RETURN;
END;
$$;