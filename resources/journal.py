import uuid
import datetime
from os import path
from flask import request, make_response, render_template
from flask_restful import Resource
from flask_jwt import jwt_required, current_identity
from flask_weasyprint import HTML, render_pdf
from models.user import UserModel
from store.s3 import S3Store


class JournalUpload(Resource):
	"""
	JournalUpload provides journal upload API.
	"""
	@jwt_required()
	def post(self):
		"""
		Upload a new journal.

		:return:
			(JSON): Journal upload success or fail message.
			(int): HTTP status code.
		"""
		f = request.form['file']
		if f is None:
			return {'message': 'no file chosen'}, 400

		# compose file path
		date = datetime.datetime.now().strftime('%Y-%m-%d')
		_id = uuid.uuid4().hex.upper()
		filepath = path.join(date, 'jnl', _id, 'jnl.md')

		# save to S3
		s3 = S3Store(filepath, f)
		(result_path, ok) = s3.sync_save()
		if not ok:
			return {'message': 'journal upload - internal server error'}, 500

		try:
			# update database
			user = UserModel.get_user('username', current_identity.id)
			user.journals.append(result_path)
			user.update_user()
		except IOError as e:
			print(e)
			return {'message': 'journal upload - internal server error'}, 500

		return {'message': 'file uploaded successfully'}

	@jwt_required()
	def put(self):
		"""
		Update a journal.

		:return:
			(JSON): Journal update success or fail message.
			(int): HTTP status code.
		"""
		f = request.form['file']
		if f is None:
			return {'message': 'no file chosen'}, 400

		filepath = request.form['filepath']
		if filepath is None:
			return {'message': 'no filepath chosen'}, 400

		s3 = S3Store(filepath, f)
		(result_path, ok) = s3.sync_save()
		if not ok:
			return {'message': 'journal upload - internal server error'}, 500

		return {'message': 'file uploaded successfully'}


class JournalPDF(Resource):
	"""
	JournalPDF provides journal PDF API.
	"""
	@jwt_required()
	def post(self):
		"""
		Extract a journal as PDF.

		:return:
			(JSON): Journal upload success or fail message.
			(int): HTTP status code.
		"""
		f = request.form['file']
		if f is None:
			return {'message': 'no file chosen'}, 400
		return render_pdf(HTML(string=f))


class JournalContent(Resource):
	"""
	JournalContent provides journal data access API.
	"""
	def get(self, filepath):
		"""
		Retrieve a journal data. (GET)

		This method checks if a filepath is provided.
		If so, then looks the file using the rest of the filepath via storage classes.

		:returns:
			(bytes): Journal data in binary.
			(int): HTTP status code, 200 for Success, 400 for Bad Request, and 404 for Not Found.
		"""
		if not filepath:
			return {'message': 'no journal path provided'}, 400
		pic_store = S3Store(filepath, None)
		data, ok = pic_store.get()
		if not ok:
			return {'message': 'no journal found'}, 404
		response = make_response(data)
		response.headers['content-type'] = 'text/plain'
		return response

	@jwt_required()
	def delete(self, filepath):
		"""
		Delete a journal data. (GET)

		This method deletes a journal in the storage.
		It also updates the user database.

		:returns:
			(int): HTTP status code, 200 for Success, 400 for Bad Request, and 404 for Not Found.
		"""
		if not filepath:
			return {'message': 'no journal found'}, 400
