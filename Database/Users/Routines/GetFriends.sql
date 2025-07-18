CREATE OR REPLACE FUNCTION users.GetFriends(_player_id INT, _status TEXT DEFAULT NULL)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    SELECT JSON_AGG(ROW_TO_JSON(res))
    FROM (SELECT fr.friend_id user_id, pl.username, pl.status
          FROM users.friends fr
          INNER JOIN users.player pl ON fr.friend_id = pl.player_id
          WHERE fr.player_id = _player_id AND pl.status = COALESCE(_status, pl.status)) res
    INTO _json;

    RETURN JSON_BUILD_OBJECT('list', _json); -- { 'list': rows }
END;
$$;