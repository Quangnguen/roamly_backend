import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Roamly Travel Social Network API')
  .setDescription(
    `
# Roamly API Documentation

Roamly là một ứng dụng mạng xã hội du lịch cho phép người dùng:
- Chia sẻ trải nghiệm du lịch
- Khám phá địa điểm mới
- Đặt homestay
- Kết nối với cộng đồng du lịch

## Authentication
Hầu hết các API đều yêu cầu JWT token. Bạn có thể:
1. Đăng ký tài khoản qua \`POST /auth/register\`
2. Đăng nhập qua \`POST /auth/login\` để lấy token
3. Click nút "Authorize" và nhập Bearer token

## File Upload
Các API upload file sử dụng \`multipart/form-data\`:
- **destinations**: Upload ảnh khi tạo địa điểm
- **homestays**: Upload ảnh khi tạo homestay  
- **addresses**: Upload ảnh khi tạo địa chỉ
- **posts**: Upload ảnh khi tạo bài viết

## Error Handling
API trả về các mã lỗi chuẩn:
- **200**: Thành công
- **201**: Tạo thành công
- **400**: Dữ liệu không hợp lệ
- **401**: Chưa xác thực
- **403**: Không có quyền
- **404**: Không tìm thấy
- **500**: Lỗi server
  `,
  )
  .setVersion('1.0.0')
  .addTag('auth', 'Xác thực và phân quyền')
  .addTag('users', 'Quản lý người dùng')
  .addTag('posts', 'Quản lý bài viết')
  .addTag('destinations', 'Quản lý địa điểm du lịch')
  .addTag('homestays', 'Quản lý homestay')
  .addTag('addresses', 'Quản lý địa chỉ')
  .addTag('comments', 'Quản lý bình luận')
  .addTag('likes', 'Quản lý lượt thích')
  .addTag('follows', 'Quản lý theo dõi')
  .addTag('chat', 'Quản lý chat')
  .addTag('notifications', 'Quản lý thông báo')
  .addTag('trips', 'Quản lý chuyến đi')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addServer('http://localhost:3000', 'Development Server')
  .build();

export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
  customSiteTitle: 'Roamly API Documentation',
  customfavIcon: '/favicon.ico',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  ],
};
