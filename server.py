import json
import sys
import os
from os.path import join
from datetime import timedelta
from flask import Flask, session, request, render_template, redirect, url_for
from flask_restful import Api
from flask_jwt import JWT, jwt_required
from flask_weasyprint import HTML, render_pdf
from security import authenticate, identity
from resources.user import UserRegister, UserData
from resources.pic import PicUpload, PicContent
from resources.journal import JournalUpload, JournalContent


# Application initialization and configs.
# Flask is initialized for this application.
# Flask-SQLAlchemy uses MySQL server, and uses 'db' as backing database.
# Flask-JWT tokens have expiration time of one day.
# ImageMagick path is acquired from Lambda system.
def create_app():
    ap = Flask(__name__)
    ap.config['JWT_EXPIRATION_DELTA'] = timedelta(seconds=86400)
    ap.secret_key = 'An_App_Secret_Key'
    exec_dir = os.getcwd()
    sys.path.append(join(exec_dir, 'site-packages'))
    os.environ['MAGICK_HOME'] = exec_dir
    lib_dir = join(exec_dir, 'lib')
    sys.path.append(lib_dir)
    return ap


# Flask-JWT authorization, which by default register the route
# '/auth' for user authentication.
app = create_app()
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
    return render_template('home.html', messages=json.dumps({'token': session['token']}))


@app.route('/journal')
def journal():
    if 'token' not in session:
        return redirect(url_for('index'))
    return render_template('journal.html', message=json.dumps({'token': session['token']}))


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


@app.route('/api/journal_pdf', methods=['POST'])
@jwt_required()
def journal_pdf():
    data = request.form['markdown']
    if data is None:
        return {'message': 'no file chosen'}, 400
    html = render_template('journal.html', data=data)
    return render_pdf(HTML(string=html))


# API endpoints:
api.add_resource(UserRegister, '/api/user/register')
api.add_resource(UserData, '/api/user/data')
api.add_resource(PicUpload, '/api/pic')
api.add_resource(PicContent, '/api/pic_content/<path:filepath>')
api.add_resource(JournalUpload, '/api/journal')
api.add_resource(JournalContent, '/api/journal_content/<path:filepath>')


if __name__ == '__main__':
    app.run()
