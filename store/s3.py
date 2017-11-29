import boto3
import botocore


class S3Store:
    """
    PicS3Store provides storage access to AWS S3.

    Attributes:
    bucket_name (str):The default AWS S3 bucket name.
    key (str): The S3 storage key of the file.
    data (bytes): The file data.
    """
    bucket_name = 'zhehui-ece1779-a3'

    def __init__(self, key, data):
        """Init.

        Args:
            key (str): The S3 storage key of the file.
            data (bytes): The file data.
        """
        self.key = key
        self.data = data

    async def save(self):
        """Save file.

        This method saves the data to AWS S3 with the key.

        :return:
            (str): Key of the stored object.
            (bool): True for success, False otherwise.
        """
        s3 = boto3.resource('s3')
        try:
            obj = s3.Object(self.bucket_name, self.key)
            obj.put(Body=self.data)
        except botocore.exceptions.ClientError:
            return '', False
        return self.key, True

    def sync_save(self):
        """Save file.

        This method saves the data to AWS S3 with the key.

        :return:
            (str): Key of the stored object.
            (bool): True for success, False otherwise.
        """
        s3 = boto3.resource('s3')
        try:
            obj = s3.Object(self.bucket_name, self.key)
            obj.put(Body=self.data)
        except botocore.exceptions.ClientError:
            return '', False
        return self.key, True

    def get(self):
        """Get file.

        This method gets the data from AWS S3 using key.

        :return:
            (bytes): Actual file data in binary.
            (bool): True for success, False otherwise.
        """
        s3 = boto3.resource('s3')
        try:
            obj = s3.Object(self.bucket_name, self.key)
            result = obj.get()
            self.data = result['Body'].read()
        except botocore.exceptions.ClientError:
            return None, False
        return self.data, True

    async def delete(self):
        """Delete file.

        This method deletes the data from AWS S3 using key.

        :return:
            (str): Key of the stored object.
            (bool): True for success, False otherwise.
        """
        s3 = boto3.client('s3')
        try:
            s3.delete_object(
                Bucket=self.bucket_name,
                Key=self.key,
            )
        except botocore.exceptions.ClientError:
            return None, False
        return self.key, True
