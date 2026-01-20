import psycopg2
import json

import string, random

from dotenv import load_dotenv
import os

load_dotenv()

DB_CONN = os.getenv("DB_CONN")

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
        # Step 1: Fetch timetable
        # Step 2: Add event
        # Step 3: Update timetable

        timetable = get_user_timetable(identifier)
        if not timetable: timetable = []

        if not event.get("uniqueCode"):
            event["uniqueCode"] = ''.join(random.choices(string.ascii_uppercase + string.digits + string.ascii_lowercase, k=16))

        for i, t in enumerate(timetable):
            if not t.get("uniqueCode"):
                timetable[i]["uniqueCode"] = event["uniqueCode"]

        timetable.append(event)

        conn = psycopg2.connect(DB_CONN)
        cur = conn.cursor()
        cur.execute(f"UPDATE users SET timetable = '{json.dumps(timetable)}' WHERE identifier = '{identifier}'")
        conn.commit()
        cur.close()
        conn.close()

        return True
    except Exception as e:
        print(e)
        return False