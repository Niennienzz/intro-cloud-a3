from flask import request, make_response
from flask_restful import Resource
from flask_jwt import jwt_required, current_identity
from models.user import UserModel


class JournalUpload(Resource):

	@jwt_required()
	def post(self):
		f = request.form['file']
		if f is None:
			return {'message': 'no file chosen'}, 400

		return {'message': 'file uploaded successfully'}
