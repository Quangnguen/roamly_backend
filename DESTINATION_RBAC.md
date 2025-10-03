# 🔐 Destination Role-Based Access Control (RBAC)

## 📋 Tổng quan

Module Destination đã được cấu hình với Role-Based Access Control để kiểm soát quyền truy cập các endpoint quan trọng.

## 👥 Roles

```typescript
enum Role {
  User = 0, // User thường
  Admin = 1, // Quản trị viên
}
```

## 🚫 Permissions Matrix

| Endpoint                     | Method | User (role=0) | Admin (role=1) | Description          |
| ---------------------------- | ------ | ------------- | -------------- | -------------------- |
| `/destinations`              | POST   | ❌ 403        | ✅ Allowed     | Tạo destination mới  |
| `/destinations/:id`          | PATCH  | ❌ 403        | ✅ Allowed     | Cập nhật destination |
| `/destinations/:id`          | DELETE | ❌ 403        | ✅ Allowed     | Xóa destination      |
| `/destinations`              | GET    | ✅ Public     | ✅ Public      | Xem danh sách        |
| `/destinations/:id`          | GET    | ✅ Public     | ✅ Public      | Xem chi tiết         |
| `/destinations/:id/like`     | POST   | ✅ Allowed    | ✅ Allowed     | Like destination     |
| `/destinations/:id/comments` | POST   | ✅ Allowed    | ✅ Allowed     | Comment              |
| `/destinations/:id/reviews`  | POST   | ✅ Allowed    | ✅ Allowed     | Review               |

## ⚙️ Implementation

### Controller Setup

```typescript
@Controller('destinations')
@UsePipes(new DestinationValidationPipe())
export class DestinationController {

  // Chỉ Admin mới được tạo
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)  // ← Chỉ role = 1
  createDestination() { ... }

  // Chỉ Admin mới được sửa
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)  // ← Chỉ role = 1
  updateDestination() { ... }

  // Chỉ Admin mới được xóa
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)  // ← Chỉ role = 1
  deleteDestination() { ... }

  // Public - không cần auth
  @Get()
  getDestinations() { ... }

  // User và Admin đều được like/comment/review
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike() { ... }
}
```

### Guards Chain

1. **JwtAuthGuard**: Xác thực JWT token, lấy thông tin user
2. **RolesGuard**: Kiểm tra role của user với `@Roles()` decorator

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
```

## 🧪 Testing in Swagger

### 1. Login để lấy JWT token

**POST** `/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response sẽ chứa token và role:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "role": 1 // ← Check role ở đây
  }
}
```

### 2. Authorize trong Swagger

1. Click button **Authorize** ở góc trên phải Swagger UI
2. Nhập: `Bearer <your-jwt-token>`
3. Click **Authorize**

### 3. Test với Admin account (role = 1)

**POST** `/destinations` - ✅ Success

```json
{
  "title": "Hội An Ancient Town",
  "location": "Hội An, Quảng Nam",
  "city": "Hội An",
  "country": "Vietnam"
}
```

Response: **201 Created**

### 4. Test với User account (role = 0)

**POST** `/destinations` - ❌ Forbidden

```json
{
  "title": "Hội An Ancient Town",
  ...
}
```

Response: **403 Forbidden**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## 🔍 Error Codes

| Code | Message      | Cause                         | Solution                        |
| ---- | ------------ | ----------------------------- | ------------------------------- |
| 401  | Unauthorized | Chưa login hoặc token hết hạn | Login lại để lấy token mới      |
| 403  | Forbidden    | User không có role phù hợp    | Dùng tài khoản Admin (role = 1) |
| 404  | Not Found    | Destination không tồn tại     | Kiểm tra lại ID                 |

## 📝 Notes

### Tại sao chỉ Admin mới tạo destination?

- **Data Quality**: Đảm bảo chất lượng thông tin địa điểm
- **Content Moderation**: Kiểm soát nội dung trước khi public
- **Prevent Spam**: Tránh spam destination giả
- **Curation**: Admin có thể review và approve các địa điểm

### User thường có thể làm gì?

✅ **Allowed:**

- Xem danh sách destinations
- Xem chi tiết destination
- Like/Unlike destination
- Comment trên destination
- Review destination (rating + review)
- Share destination

❌ **Forbidden:**

- Tạo destination mới
- Sửa destination
- Xóa destination

## 🚀 Setup Instructions

### 1. Check User Role

Query MongoDB để xem role của user:

```javascript
db.users.findOne({ email: 'admin@example.com' });
// { ..., role: 1 }  ← Admin
// { ..., role: 0 }  ← User
```

### 2. Update User to Admin

```javascript
db.users.updateOne({ email: 'admin@example.com' }, { $set: { role: 1 } });
```

### 3. Create Admin Account

**POST** `/auth/register`

```json
{
  "email": "admin@roamly.com",
  "password": "AdminSecure123!",
  "name": "Admin User",
  "username": "admin"
}
```

Sau đó update role trong database:

```javascript
db.users.updateOne({ email: 'admin@roamly.com' }, { $set: { role: 1 } });
```

## 🔐 Security Best Practices

1. ✅ **Never expose role in URLs** - Role được lưu trong JWT token và database
2. ✅ **Always verify role server-side** - Dùng Guards, không tin client
3. ✅ **Use HTTPS in production** - Bảo vệ JWT token khi truyền
4. ✅ **Rotate JWT secrets regularly** - Tăng bảo mật
5. ✅ **Log admin actions** - Audit trail cho các thao tác quan trọng

## 📊 Future Enhancements

### Multi-level Roles

```typescript
enum Role {
  User = 0,
  Moderator = 1,
  Admin = 2,
  SuperAdmin = 3,
}
```

### Permission-based

```typescript
enum Permission {
  CREATE_DESTINATION = 'create:destination',
  UPDATE_DESTINATION = 'update:destination',
  DELETE_DESTINATION = 'delete:destination',
  MANAGE_USERS = 'manage:users',
}

@Permissions(Permission.CREATE_DESTINATION)
```
