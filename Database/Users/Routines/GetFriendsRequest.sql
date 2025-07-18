CREATE OR REPLACE FUNCTION users.GetFriendsRequest(_player_id INT)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    SELECT JSON_AGG(ROW_TO_JSON(res))
    FROM (SELECT pl.player_id user_id, pl.username, pl.status
          FROM users.friends_requests fr
          INNER JOIN users.player pl ON fr.player_id = pl.player_id
          WHERE fr.possible_friend_id = _player_id) res
    INTO _json;

    RETURN JSON_BUILD_OBJECT('list', _json); -- { 'list': rows }
END;
$$;