from hashlib import sha256
from werkzeug.security import safe_str_cmp
from models.user import UserModel


def authenticate(username, password):
	"""User authentication.

	This function a Flask-JWT authentication_handler.
	It compares the username and password in database.
	Note that user password is stored as SHA-256 hash with a user specific salt.
	The function generates the hash again and compares with the stored hash.

	:param username: string
	:param password: string

	:return: UserModel: The user account if auth is successful, otherwise None.
	"""
	user = UserModel.scan_table(filter_key='username', filter_value=username)
	if user:
		password_hash = sha256((password + user.pwdsalt).encode('utf-8')).hexdigest()
		if safe_str_cmp(password_hash.encode('utf-8'), user.password.encode('utf-8')):
			return user


def identity(payload):
	"""User identity.

	This function a Flask-JWT identity_handler.
	It retrieves the user account from payload.

	:param payload: The JWT payload.

	:return: UserModel: The user account.
	"""
	username = payload['identity']
	return UserModel.scan_table(filter_key='username', filter_value=username)
