from flask import request, make_response
from flask_restful import Resource
from flask_jwt import jwt_required, current_identity
from store.trans import PicTrans
from models.user import UserModel
from store.s3 import PicS3Store


class PicUpload(Resource):

	@jwt_required()
	def post(self):
		f = request.files['file']
		if f is None:
			return {'message': 'no file chosen'}, 400

		try:
			# make transforms of image
			pic_trans = PicTrans(f.stream.read())
			origin = pic_trans.trans_save()

			# update database
			user = UserModel.get_user('username', current_identity.id)
			user.images.append(origin)
			user.update_user()
		except IOError as e:
			print(e)
			return {'message': 'pic upload - internal server error'}, 500

		return {'message': 'file uploaded successfully'}


class PicContent(Resource):
	"""
	PicContent provides image data access API.
	"""
	def get(self, file_path):
		"""
		Retrieve an image data. (GET)

		This method checks if a filepath is provided.
		If so, it strips prefix 'images/' which is the API agreed on client and server.
		It then looks the file using the rest of the filepath via storage classes.

		:returns:
			(bytes): Image data in binary.
			(int): HTTP status code, 200 for Success, 400 for Bad Request, and 404 for Not Found.
		"""
		if not file_path:
			return {'message': 'no image path provided'}, 400
		if file_path.startswith('images/'):
			file_path = file_path[len('images/'):]
		pic_store = PicS3Store(file_path, None)
		data, ok = pic_store.get()
		if not ok:
			return {'message': 'no image found'}, 404
		response = make_response(data)
		response.headers['content-type'] = 'image/jpeg'
		return response
