/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { UploadApiResponse} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary) {}

  /**
   * Upload một ảnh duy nhất
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder: 'nestjs_uploads' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload nhiều ảnh cùng lúc
   */
  async uploadMultiple(files: Express.Multer.File[]): Promise<string[]> {
    // Tạo mảng các promises cho tất cả các ảnh
    const uploadPromises = files.map((file) => this.uploadImage(file));

    // Chạy tất cả các promise đồng thời và đợi kết quả
    const results = await Promise.all(uploadPromises);

    // Trả về mảng các URL của ảnh
    return results.map((result) => result.secure_url);
  }

  /**
   * Xoá ảnh bằng public ID
   */
  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  /**
   * Trích xuất public_id từ URL (để xoá ảnh)
   * https://res.cloudinary.com/demo/image/upload/v123456/nestjs_uploads/abc123.jpg
   * -> abc123
   */
  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0]; // loại bỏ phần đuôi .jpg, .png
  }
}
