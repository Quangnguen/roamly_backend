# 👍 Like API Testing Guide

## 🔐 Authentication

Tất cả các endpoint đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📍 Endpoints

### 1. ✅ Like một đối tượng

**POST** `/likes`

**Request Body:**

```json
{
  "targetId": "507f1f77bcf86cd799439011",
  "type": "post",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Fields:**

- `targetId` (required) - ID của đối tượng cần like
- `type` (required) - Loại đối tượng: `post`, `comment`, hoặc `destination`
- `userId` (optional) - ID của user thực hiện like
  - Nếu không truyền: Tự động lấy từ JWT token (recommended)
  - Nếu truyền: Override user (dùng cho testing/admin)

**Type values:**

- `post` - Like một bài viết
- `comment` - Like một comment
- `destination` - Like một địa điểm du lịch

**Response Success (201):**

```json
{
  "message": "Đã thích bài viết",
  "statusCode": 201,
  "status": "success",
  "data": {
    "id": "like-id",
    "userId": "user-id",
    "targetId": "target-id",
    "type": "post",
    "createdAt": "2025-10-03T10:00:00.000Z"
  }
}
```

**Response Error (400):**

```json
{
  "message": "Bạn đã thích bài viết này rồi",
  "statusCode": 400,
  "status": "error"
}
```

---

### 2. ❌ Unlike một đối tượng

**DELETE** `/likes`

**Request Body:**

```json
{
  "targetId": "507f1f77bcf86cd799439011",
  "type": "post",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Fields:**

- `targetId` (required) - ID của đối tượng cần unlike
- `type` (required) - Loại đối tượng: `post`, `comment`, hoặc `destination`
- `userId` (optional) - ID của user thực hiện unlike (nếu không truyền sẽ lấy từ JWT token)

**Response Success (200):**

```json
{
  "message": "Đã bỏ thích",
  "statusCode": 200,
  "status": "success"
}
```

**Response Error (400):**

```json
{
  "message": "Bạn chưa thích bài viết này",
  "statusCode": 400,
  "status": "error"
}
```

---

## 🧪 Test Cases

### Test 1: Like một Post (với JWT token)

1. Lấy `postId` từ endpoint GET `/posts`
2. Call POST `/likes` với JWT token trong header:
   ```json
   {
     "targetId": "<postId>",
     "type": "post"
   }
   ```
3. Kiểm tra:
   - Response 201
   - Post's `likeCount` tăng lên 1
   - Get post detail thấy `isLiked: true`

### Test 1b: Like một Post (với userId override)

1. Lấy `postId` và `userId` để test
2. Call POST `/likes` với:
   ```json
   {
     "targetId": "<postId>",
     "type": "post",
     "userId": "<specific-userId>"
   }
   ```
3. Kiểm tra like được tạo với userId được chỉ định

### Test 2: Unlike một Post

1. Call DELETE `/likes` với post đã like
2. Kiểm tra:
   - Response 200
   - Post's `likeCount` giảm đi 1
   - Get post detail thấy `isLiked: false`

### Test 3: Like một Destination

1. Lấy `destinationId` từ endpoint GET `/destinations`
2. Call POST `/likes` với:
   ```json
   {
     "targetId": "<destinationId>",
     "type": "destination"
   }
   ```
3. Kiểm tra:
   - Response 201
   - Destination's `likeCount` tăng lên 1
   - Get destination detail thấy `isLiked: true`
   - Owner nhận notification (nếu khác người like)

### Test 4: Like một Comment

1. Lấy `commentId` từ comments của một post
2. Call POST `/likes` với:
   ```json
   {
     "targetId": "<commentId>",
     "type": "comment"
   }
   ```
3. Kiểm tra:
   - Response 201
   - Comment's `likeCount` tăng lên 1

### Test 5: Duplicate Like (Error case)

1. Like một post/comment/destination
2. Try to like lại lần nữa
3. Expect: Response 400 "Bạn đã thích ... này rồi"

### Test 6: Unlike chưa like (Error case)

1. Chọn một post chưa like
2. Call DELETE `/likes`
3. Expect: Response 400 "Bạn chưa thích ... này"

---

## 🔔 Real-time Events

Khi like/unlike, hệ thống sẽ emit socket events:

### Post Like:

```javascript
socket.on('post_liked', (data) => {
  // data: { postId, userId, likeCount }
});

socket.on('post_unliked', (data) => {
  // data: { postId, userId, likeCount }
});
```

### Comment Like:

```javascript
socket.on('comment_liked', (data) => {
  // data: { commentId, userId, likeCount }
});

socket.on('comment_unliked', (data) => {
  // data: { commentId, userId, likeCount }
});
```

### Destination Like:

```javascript
socket.on('destination_liked', (data) => {
  // data: { destinationId, userId, likeCount }
});

socket.on('destination_unliked', (data) => {
  // data: { destinationId, userId, likeCount }
});
```

### Notification:

```javascript
socket.on('new_notification', (notification) => {
  // Nhận thông báo khi có người like
});
```

---

## 📊 Swagger UI

Truy cập Swagger để test trực tiếp:

```
http://localhost:8686/api
```

1. Click vào section **👍 Likes**
2. Click **Authorize** ở góc trên phải
3. Nhập Bearer token
4. Test các endpoints:
   - POST `/likes` - Like
   - DELETE `/likes` - Unlike

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized

- Kiểm tra JWT token có đúng không
- Token có hết hạn không
- Header format: `Authorization: Bearer <token>`

### Lỗi 400 Bad Request

- Kiểm tra `type` phải là: `post`, `comment`, hoặc `destination`
- `targetId` phải tồn tại trong database

### Lỗi 404 Not Found

- Object với `targetId` không tồn tại
- Kiểm tra lại ID có đúng không

---

## 💡 Tips

1. **Get isLiked status**: Các endpoint GET (posts, destinations, comments) đã tự động trả về `isLiked: boolean` cho user hiện tại
2. **Like count**: `likeCount` được tự động cập nhật khi like/unlike
3. **Notifications**: Chỉ gửi notification khi người like khác với chủ đối tượng
4. **Socket events**: Listen để update UI real-time không cần refresh
