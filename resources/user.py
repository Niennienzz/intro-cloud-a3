from flask_restful import Resource, reqparse
from models.user import UserModel


class UserRegister(Resource):
	"""
	UserRegister provides user registration API.

	Attributes:
	parser (RequestParser): The Flask-RESTful request parser.
	It parses username and password from the JSON payload during user registration.
	"""
	parser = reqparse.RequestParser()
	parser.add_argument(
		'username',
		type=str,
		required=True
	)

	parser.add_argument(
		'password',
		type=str,
		required=True
	)

	def get(self):
		"""
		Get table meta data. (GEt)
		:return:
			JSON: Registration success or fail message.
			int: HTTP status code, 200 for Success and 400 for Bad Request.
		"""
		return UserModel.get_table_metadata()

	def post(self):
		"""
		Register a user. (POST)

		This method checks if a user account already exists.
		If so, the registration will be aborted.
		Else, a user account will be save to database.

		:return:
			JSON: Registration success or fail message.
			int: HTTP status code, 201 for Created and 400 for Bad Request.
		"""
		data = UserRegister.parser.parse_args()
		response = UserModel.scan_table(filter_key='username', filter_value=data['username'])
		if response['Count'] != 0:
			return {'message': 'user already exists'}, 400

		user = UserModel(data['username'], data['password'])
		user.set_user()
		return {'message': 'user created successfully'}, 201


class UserUpdate(Resource):
	"""
	UserUpdate provides user update/delete/patch API.

	Attributes:
	parser (RequestParser): The Flask-RESTful request parser.
	It parses username and password from the JSON payload during user registration.
	"""
