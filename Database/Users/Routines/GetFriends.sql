CREATE OR REPLACE FUNCTION users.GetFriends(_player_id uuid, _status TEXT DEFAULT NULL)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    SELECT JSON_AGG(ROW_TO_JSON(res))
    FROM (SELECT fr.friend_uuid user_id, pl.username, pl.status
          FROM users.friends fr
          INNER JOIN users.player pl ON fr.friend_uuid = pl.player_uuid
          WHERE fr.player_uuid = _player_id AND pl.status = COALESCE(_status, pl.status)) res
    INTO _json;

    RETURN JSON_BUILD_OBJECT('list', _json); -- { 'list': rows }
END;
$$;