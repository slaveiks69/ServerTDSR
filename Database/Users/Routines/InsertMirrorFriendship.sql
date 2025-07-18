create or replace function users.insert_mirror_friendship() returns trigger
    language plpgsql
as
$$
   BEGIN
       INSERT INTO users.friends (player_id, friend_id)
       VALUES (NEW.friend_id, NEW.player_id)
       ON CONFLICT DO NOTHING;
       RETURN NULL;
   END;
   $$;


