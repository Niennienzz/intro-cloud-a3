from boto3 import resource
from boto3.dynamodb.conditions import Key
from const.const import Constants
from hashlib import sha256
from random import choice


class UserModel:
	"""
	UserModel provides user JSON data model.

	Attributes:
	table_name: The DynamoDB table name.
	dynamodb_resource: The Boto3 DynamoDB resource.

	JSON Schema:
		user {
			username: string,
			passsalt: string,
			password: string,
			images: [
					string,
					...
				],
			image_sets: [
				{
					set_name: string,
					imgs: [
						string,
						...
					],
				}
				...
			],
			journals:
				[
					string,
					...
				]
		}
	"""

	table_name = 'users'
	dynamodb_resource = resource('dynamodb')

	def __init__(self, username, password):
		self.username = username
		self.pwdsalt = ''.join(choice(Constants.ALPHABET) for i in range(16))
		self.password = sha256((password + self.pwdsalt).encode('utf-8')).hexdigest()

	def get_user(self, pk_name, pk_value):
		"""
		Return a user from table according to primary key.
		:param pk_name: string
		:param pk_value: string
		:return: JSON: user
		"""
		table = self.dynamodb_resource.Table(self.table_name)
		response = table.get_item(Key={pk_name: pk_value})
		return response

	def set_user(self):
		"""
		Add a user to table.
		:return: JSON: user
		"""
		col_dict = {'username': self.username, 'pwdsalt': self.pwdsalt, 'password': self.password}
		table = self.dynamodb_resource.Table(self.table_name)
		response = table.put_item(Item=col_dict)
		return response

	def delete_user(self, pk_name, pk_value):
		"""
		Delete a user from table according to primary key.
		:param pk_name: string
		:param pk_value: string
		:return: JSON: user
		"""
		table = self.dynamodb_resource.Table(self.table_name)
		response = table.delete_item(Key={pk_name: pk_value})
		return response

	@classmethod
	def get_table_metadata(cls):
		"""
		Get metadata about the users table.
		:return: JSON: metadata
		"""
		table = cls.dynamodb_resource.Table(cls.table_name)
		return {
			'num_items': table.item_count,
			'primary_key_name': table.key_schema[0],
			'status': table.table_status,
			'bytes_size': table.table_size_bytes,
			'global_secondary_indexes': table.global_secondary_indexes
		}

	@classmethod
	def scan_table(cls, filter_key=None, filter_value=None):
		"""
		Scan the users table according to filter_key and filter_value.
		:param filter_key: string
		:param filter_value: string
		:return: JSON: list of users
		"""
		table = cls.dynamodb_resource.Table(cls.table_name)
		if filter_key and filter_value:
			filter_exp = Key(filter_key).eq(filter_value)
			response = table.scan(FilterExpression=filter_exp)
		else:
			response = table.scan()
		return response

	@classmethod
	def query_table(cls, filter_key=None, filter_value=None):
		"""
		Query the users table according to filter_key and filter_value.
		:param filter_key: string
		:param filter_value: string
		:return: JSON: list of users
		"""
		table = cls.dynamodb_resource.Table(cls.table_name)
		if filter_key and filter_value:
			filter_exp = Key(filter_key).eq(filter_value)
			response = table.query(KeyConditionExpression=filter_exp)
		else:
			response = table.query()
		return response

	@classmethod
	def scan_table_all_pages(cls, filter_key=None, filter_value=None):
		"""
		Scan the users table according to filter_key and filter_value.
		All pages of results are returned.
		:param filter_key: string
		:param filter_value: string
		:return: JSON: list of users
		"""
		table = cls.dynamodb_resource.Table(cls.table_name)
		if filter_key and filter_value:
			filter_exp = Key(filter_key).eq(filter_value)
			response = table.scan(FilterExpression=filter_exp)
		else:
			response = table.scan()

		users = response['Items']
		while True:
			if response.get('LastEvaluateKey'):
				response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
				users += response['Items']
			else:
				break

		return users
