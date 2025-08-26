CREATE OR REPLACE FUNCTION users.AddMoney(_player_id uuid, _money int)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    UPDATE users.player SET money = money + _money WHERE player_uuid = _player_id;

    SELECT ROW_TO_JSON(res)
    FROM (SELECT money
          FROM users.player
          WHERE player_uuid = _player_id) res
    INTO _json;

    RETURN _json;
END;
$$;