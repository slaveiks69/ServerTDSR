CREATE OR REPLACE FUNCTION users.SearchUser(_username TEXT)
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
          FROM users.player pl
          WHERE pl.username ILIKE _username || '%' LIMIT 10) res
    INTO _json;

    RETURN JSON_BUILD_OBJECT('list', _json); -- { 'list': rows }
END;
$$;