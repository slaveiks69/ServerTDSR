CREATE OR REPLACE FUNCTION users.GetUser(_player_id INT)
    RETURNS JSON AS
$$
DECLARE
    _json JSON;
BEGIN
    if _player_id is null then
        insert into users.player(status) values('online') RETURNING player_id INTO _player_id;
    end if;

    SELECT JSON_AGG(ROW_TO_JSON(res))
    FROM (SELECT *
          FROM users.player
          WHERE player_id = _player_id) res
    INTO _json;
    RETURN _json;
END;
$$ LANGUAGE plpgsql;