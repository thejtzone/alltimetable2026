from flask import Flask, render_template, redirect, jsonify, request
app = Flask(__name__)
PORT = 7554

import dbdata


#!---- ROOT ----!#
@app.route('/<path:path>') 
def path_root(path): return render_template("root/root.html", path=path)

@app.route('/')
def root(): return render_template("root/root.html", path="index")


#!---- INTERNAL ----!#
@app.route('/internal/<path:path>')
def catch_all(path): return "404 - Page \"/" + path + "\" was not found."

@app.route('/internal/user/<user>')
def user_page(user): return render_template("internal/user.html", user=user)

@app.route('/internal/index')
def index_page(): return render_template("internal/index.html")


#!---- API ----!#
@app.route('/api/getUser/<user>')
def get_user(user): return jsonify(dbdata.get_user_timetable(user))

@app.route('/api/getAllUsers')
def get_all_users(): return jsonify(dbdata.get_all_timetables())


#!---- ADMIN ----!#
@app.route('/admin/<user>/addEvent')
def add_event(user): return render_template("admin/addEvent.html", user=user)

@app.route('/admin/addEvent/<user>', methods=['POST'])
def add_event_post(user): return jsonify({"success": dbdata.add_event(user, request.get_json() or {}) })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)