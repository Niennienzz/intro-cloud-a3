from flask import Flask
app = Flask(__name__)


@app.route('/')
def index():
    return 'Hello Zappa, Hello AWS Lambda!\n'


if __name__ == '__main__':
    app.run()
