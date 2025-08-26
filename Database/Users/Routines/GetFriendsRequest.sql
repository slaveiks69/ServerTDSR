CREATE OR REPLACE FUNCTION users.GetFriendsRequest(_player_id uuid)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    SELECT JSON_AGG(ROW_TO_JSON(res))
    FROM (SELECT pl.player_uuid user_id, pl.username, pl.status
          FROM users.friends_requests fr
          INNER JOIN users.player pl ON fr.player_uuid = pl.player_uuid
          WHERE fr.possible_friend_uuid = _player_id) res
    INTO _json;

    RETURN JSON_BUILD_OBJECT('list', _json); -- { 'list': rows }
END;
$$;