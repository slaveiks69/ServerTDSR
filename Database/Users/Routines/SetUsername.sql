CREATE OR REPLACE FUNCTION users.SetUsername(_player_id INT, _username TEXT)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
BEGIN
    CASE
        WHEN EXISTS(SELECT 1 FROM users.player WHERE username = _username) THEN
            RETURN core.errmessage(_errcode := 'exist.username', _msg := 'idi nahui', _detail := NULL);
        WHEN EXISTS(SELECT 1 FROM users.player WHERE player_id = _player_id) THEN
            UPDATE users.player SET username = _username WHERE player_id = _player_id;
            RETURN JSON_BUILD_OBJECT('username',_username);
        ELSE
            RETURN core.errmessage(_errcode := 'null.player_id', _msg := 'idi nahui', _detail := NULL);
    END CASE;
END;
$$;