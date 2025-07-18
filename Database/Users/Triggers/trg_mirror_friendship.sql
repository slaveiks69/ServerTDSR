create trigger trg_mirror_friendship
    after insert
    on users.friends
    for each row
execute procedure users.insert_mirror_friendship();