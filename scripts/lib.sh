#!/usr/bin/env bash

get_latest_backup() {
    local dir="$PWD/backups"
    local latest_file=""
    local latest_timestamp=0
    local file
    local date_part
    local timestamp

    for file in "$dir"/backup_*.dump; do
        [[ -f "$file" ]] || continue

        # Extract date from filename (backup_DD.MM.YYYY.dump)
        date_part="${file##*/}"
        date_part="${date_part#backup_}"
        date_part="${date_part%.dump}"

        # Convert date to Unix timestamp
        timestamp=$(date -j -f "%d.%m.%Y" "$date_part" +%s 2>/dev/null) || continue
        if (( timestamp > latest_timestamp )); then
            latest_timestamp=$timestamp
            latest_file="$file"
        fi
    done

    [[ -n "$latest_file" ]] || return 1
    printf '%s\n' "$latest_file"
}

# Example usage
# if latest_backup=$(get_latest_backup); then
#     echo "Latest backup: $latest_backup"
# else
#     echo "No valid backup files found."
# fi
