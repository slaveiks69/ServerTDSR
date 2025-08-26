CREATE OR REPLACE FUNCTION users.GetUser(_player_id uuid, _is_join BOOLEAN)
    RETURNS JSON
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _json JSON;
BEGIN
    IF _player_id IS NOT NULL AND _is_join = false THEN
        UPDATE users.player SET status = 'offline' WHERE player_uuid = _player_id;
        RETURN NULL;
    END IF;

    IF _player_id IS NOT NULL AND _is_join = true THEN
        UPDATE users.player SET status = 'online' WHERE player_uuid = _player_id;
    END IF;

    IF _player_id IS NULL THEN
        INSERT INTO users.player(status) VALUES ('online') RETURNING player_uuid INTO _player_id;
    END IF;

    SELECT ROW_TO_JSON(res)
    FROM (SELECT *
          FROM users.player
          WHERE player_uuid = _player_id) res
    INTO _json;

    RETURN _json;
END;
$$;