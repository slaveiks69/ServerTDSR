create or replace function users.insert_mirror_friendship() returns trigger
    language plpgsql
as
$$
   BEGIN
       INSERT INTO users.friends (player_uuid, friend_uuid)
       VALUES (NEW.friend_uuid, NEW.player_uuid)
       ON CONFLICT DO NOTHING;
       RETURN NULL;
   END;
   $$;


