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
    if not classlist or not classlist[0]:
        cur.close()
        conn.close()
        return []
    
    # classlist = ["x", "y", ...]

    cur.execute("SELECT * FROM events WHERE \"uniqueCode\" IN ({})".format(','.join([f'\'{x}\'' for x in classlist[0]])))
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

    if not classlist or not classlist[0]:
        cur.close()
        conn.close()
        return {}

    timetables = {}
    for identifier, cl in classlist:
        cur.execute("SELECT * FROM events WHERE \"uniqueCode\" IN ({})".format(','.join([f'\'{x}\'' for x in cl[0]])))
        columns = [desc[0] for desc in cur.description]
        results = cur.fetchall()
        timetables[identifier] = [dict(zip(columns, result)) for result in results]

    cur.close()
    conn.close()
    return timetables


# Makers
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

    eventType = event.get('eventType')
    if not eventType: 
        eventType = 'general'
        event['eventType'] = eventType

    values = [event.get(field) for field in fields]
    
    fields.append("users")
    values.append("[\"{}\"]".format(identifier))
    
    cur.execute("INSERT INTO events (\"{}\") VALUES ({})".format(
        '\", \"'.join(fields), ', '.join(['%s' for _ in fields])), values)
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