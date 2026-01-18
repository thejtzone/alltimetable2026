from flask import Flask, render_template, redirect, jsonify
app = Flask(__name__)
PORT = 7554

import dbdata

@app.route('/<path:path>') 
def path_root(path): return render_template("root.html", path=path)

@app.route('/')
def root(): return render_template("root.html", path="index")

@app.route('/internal/user/<user>')
def user_page(user):
    timetable = dbdata.get_user_timetable(user)
    return render_template("user.html", user=user, timetable=timetable)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)