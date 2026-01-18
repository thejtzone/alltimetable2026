import psycopg2

DB_CONN = "postgresql://neondb_owner:npg_KI2qSMyNnc1X@ep-holy-cake-a7hqt7xv-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Table: users
# Columns: identifier, displayname, timetable
# Types:   text,       text / null, jsonb (array)


# Getters
def get_user_timetable(identifier: str) -> list:
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    cur.execute(f"SELECT timetable FROM users WHERE identifier = '{identifier}'")
    results = cur.fetchone()
    cur.close()
    conn.close()
    return results[0]

def get_all_timetables() -> dict[str, list]:
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    cur.execute("SELECT identifier, timetable FROM users")
    results = cur.fetchall()
    cur.close()
    conn.close()
    return {r[0]: r[1] for r in results}




# Parsers
def parse_timetable(timetable: list[dict], day: int) -> list[str]:
    # Timetable in format of:
    # [{ start: x, end: y, name: z }, ...]
    # Convert to format of:
    # [z, z, z, ...] until y is reached
    
    day_timetable: list = filter(lambda x: x['day'] == day, timetable)
    converted = []
    cur_time = 0
    while cur_time < 24 * 60:
        converted.append([])
        cur_time += 1
    for entry in day_timetable:
        start = entry['start']
        end = entry['end']
        name = entry['name']
        for i in range(start, end):
            converted[i].append(name)
    return converted

def parse_timetables(timetables: dict[str, list], day: int) -> dict[str, list]:
    return dict(map(lambda x: (x[0], parse_timetable(x[1], day)), timetables.items()))



# Makers
def new_timetable(timetable: list[str], day: int) -> list[dict]:
    uniques = list(set(timetable))
    firstIndexes = [timetable.index(x) for x in uniques]
    reversedTimetable = list(reversed(timetable))
    lastIndexes = [reversedTimetable.index(x) for x in uniques]
    return [{
        'day': day,
        'start': firstIndexes[x],
        'end': lastIndexes[x] + 1,
        'name': uniques[x]
    } for x, u in enumerate(uniques)]

def add_event(identifier: str, event: dict) -> bool:
    try:
        conn = psycopg2.connect(DB_CONN)
        cur = conn.cursor()
        cur.execute(f"UPDATE users SET timetable = array_append(timetable, '{event}') WHERE identifier = '{identifier}'")
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(e)
        return False