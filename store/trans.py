import asyncio
import uuid
import datetime
from os import path
from store.s3 import S3Store
from wand.image import Image


class PicTrans:
    """
    PicTrans generates image transformations and save to disk.

    Attributes:
    origin_path (str): The filepath to the original image file.
    pic_stores (dict of PicS3Store): PicStore for each transformation.
    """

    def __init__(self, data):
        """Init.

        The init method takes the input image data and converts it into JPEG format.
        Then the method generates a relative filepath as origin_path.
        The origin_path has a format of {yyyy-mm-dd}/img/{uuid}/original.jpg

        :param data (bytes): The original image data.
        """
        # compose file path
        date = datetime.datetime.now().strftime('%Y-%m-%d')
        _id = uuid.uuid4().hex.upper()
        self.origin_path = path.join(date, 'img', _id, 'origin.jpg')

        # ensure jpeg image
        with Image(blob=data) as original:
            with original.convert('jpeg') as converted:
                self.data = converted.make_blob()

        # set original picture storage
        self.pic_stores = {self.origin_path: S3Store(self.origin_path, self.data)}

    def trans(self):
        """
        Make transformations.

        This method makes a thumbnail in memory.
        """
        self.make_thumbnail()

    def make_thumbnail(self):
        """
        Make thumbnail.
        """
        thum_path = path.join(path.dirname(self.origin_path), 'thumbnail.jpg')
        with Image(blob=self.data) as image:
            x, y = image.size
            if x > 300 and y > 300:
                with image.clone() as img:
                    img.crop(width=300, height=300, gravity='center')
                    self.pic_stores[thum_path] = S3Store(thum_path, img.make_blob())
            else:
                self.pic_stores[thum_path] = S3Store(thum_path, image.make_blob())

    def save(self):
        """
        Save files.

        This method saves the original image as well as its thumbnail on disk.
        It does so by calling the underlying PicS3Store.save() for each image.
        Each save is run in a separate coroutine.

        :returns: string: The original path of image.
        """
        funcs = []
        for key, store in self.pic_stores.items():
            funcs.append(store.save)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(asyncio.gather(
            funcs[0](),
            funcs[1](),
        ))
        loop.close()

    def trans_save(self):
        """
        Transform and save.

        This method combines trans() and save().
        It makes thumbnail, and save original/thumbnail on disk.

        :returns: string: The filepath of the original image saved.
        """
        self.trans()
        self.save()
        return self.origin_path
