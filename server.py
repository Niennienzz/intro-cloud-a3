import json
from flask import Flask, session, request, render_template, redirect, url_for
from flask_restful import Api
from flask_jwt import JWT
from security import authenticate, identity
from resources.user import UserRegister

app = Flask(__name__)


# Flask-JWT authorization, which by default register the route
# '/auth' for user authentication.
api = Api(app)
jwt = JWT(app, authenticate, identity)


# Web site endpoints:
# '/' for index (welcome page).
# '/home' for user home page.
# '/login' for user login.
# '/logout' for user logout.
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/home')
def home():
    if 'token' not in session:
        return redirect(url_for('index'))
    return render_template('home.html', messages=json.dumps({"token": session['token']}))


@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        token = request.form['token']
        session['token'] = token
        return json.dumps({'message': 'ok', 'redirect': '/home?token='+token})


@app.route('/logout')
def logout():
    session.pop('token', None)
    return json.dumps({'message': 'ok', 'redirect': '/'})


# API endpoints:
api.add_resource(UserRegister, '/api/user/register')


if __name__ == '__main__':
    app.run()
