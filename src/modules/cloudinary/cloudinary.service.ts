import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl) {
      // Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
      const match = cloudinaryUrl.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+)$/);
      if (match) {
        const [, apiKey, apiSecret, cloudName] = match;
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });
      }
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    // file.path will be the local temp path, but with CloudinaryStorage we can upload directly.
    // For safety, we upload using the buffer.
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url);
      }).end(file.buffer);
    });
  }
}
