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

    cur.execute(f"SELECT classlist FROM users WHERE identifier = '{identifier}'")
    classlist = cur.fetchone()

    cur.execute(f"SELECT * FROM events WHERE uniqueCode IN ({','.join([f'\'{x[0]}\'' for x in classlist])})")
    columns = [desc[0] for desc in cur.description]
    results = cur.fetchall()

    cur.close()
    conn.close()
    return [dict(zip(columns, result)) for result in results]

def get_all_timetables() -> dict[str, list]:
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    cur.execute("SELECT identifier, classlist FROM users")
    classlist = cur.fetchall()

    timetables = {}
    for identifier, cl in classlist:
        cur.execute(f"SELECT * FROM events WHERE uniqueCode IN ({','.join([f'\'{x[0]}\'' for x in cl])})")
        columns = [desc[0] for desc in cur.description]
        results = cur.fetchall()
        timetables[identifier] = [dict(zip(columns, result)) for result in results]

    cur.close()
    conn.close()
    return timetables




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
    fields = [
        "uniqueCode",   # (primary) Text
        "name",         # Text (not null)
        "desc",         # Text / null
        "start",        # int (not null)
        "end",          # int (not null)
        "day",          # int (not null)
        "weeks",        # jsonb (array) (not null)
        "color",        # Text / null
        "url",          # Text / null
        "eventType"     # Enum (subject, curricular, optIn, general) (not null)
    ]

    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    uniqueCode = event.get('uniqueCode')
    if not uniqueCode: 
        uniqueCode = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        event['uniqueCode'] = uniqueCode

    values = [event[field] for field in fields]
    
    cur.execute(f"INSERT INTO events ({','.join(fields)}) VALUES ({','.join(['%s' for _ in fields])})", values)
    conn.commit()

    # Get current user classlist
    cur.execute(f"SELECT classlist FROM users WHERE identifier = '{identifier}'")
    classlist = cur.fetchone()

    # Update classlist
    classlist[0].append(uniqueCode)
    cur.execute(f"UPDATE users SET classlist = '{json.dumps(classlist[0])}' WHERE identifier = '{identifier}'")
    conn.commit()

    cur.close()
    conn.close()
    return True