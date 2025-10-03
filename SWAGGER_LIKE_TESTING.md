# 🧪 Hướng dẫn Test Like API trên Swagger UI

## 📋 Các bước thực hiện

### Bước 1: Mở Swagger UI

```
http://localhost:3000/api
```

### Bước 2: Login để lấy JWT Token

1. **Tìm section 🔐 Auth** trong Swagger UI
2. Click vào **POST /auth/login**
3. Click button **"Try it out"**
4. Nhập credentials:

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

5. Click **"Execute"**

6. **Copy accessToken** từ Response body:

```json
{
  "message": "Login successful",
  "statusCode": 200,
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI..." // ← Copy cái này
  }
}
```

### Bước 3: Authorize trong Swagger

1. **Tìm button Authorize 🔓** ở góc trên bên phải của Swagger UI (cạnh logo Swagger)

2. Click vào button **"Authorize"**

3. Một popup sẽ hiện ra với field **"Value"**

4. Nhập vào field này:

   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI...
   ```

   ⚠️ **Chú ý:**

   - Phải có chữ `Bearer` (chữ B viết hoa)
   - Có dấu cách giữa `Bearer` và token
   - Format: `Bearer <your-token>`

5. Click button **"Authorize"**

6. Click button **"Close"** để đóng popup

7. Bây giờ button Authorize sẽ có icon 🔒 (đã khóa) → Token đã được set

### Bước 4: Test Like Destination

1. **Tìm section 👍 Likes** trong Swagger UI

2. Click vào **POST /likes**

3. Click button **"Try it out"**

4. Nhập Request body:

```json
{
  "targetId": "b076e568-5b84-4046-8daf-7a4a996f1b00",
  "type": "destination"
}
```

**Các fields:**

- `targetId`: ID của destination/post/comment cần like
- `type`: `"destination"` hoặc `"post"` hoặc `"comment"`
- `userId`: (optional) để trống sẽ tự động lấy từ token

5. Click button **"Execute"**

6. **Check Response:**

✅ **Success (201):**

```json
{
  "message": "Đã thích địa điểm",
  "statusCode": 201,
  "status": "success",
  "data": {
    "id": "like-id",
    "userId": "0f1ccc24-5ec4-45a0-9b8a-aec8bf772528",
    "targetId": "b076e568-5b84-4046-8daf-7a4a996f1b00",
    "type": "destination",
    "createdAt": "2025-10-03T07:36:36.370Z"
  }
}
```

❌ **Error (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

→ Token chưa được set hoặc đã hết hạn. Quay lại Bước 2.

### Bước 5: Test Unlike Destination

1. Click vào **DELETE /likes**

2. Click **"Try it out"**

3. Nhập body (giống POST):

```json
{
  "targetId": "b076e568-5b84-4046-8daf-7a4a996f1b00",
  "type": "destination"
}
```

4. Click **"Execute"**

5. **Check Response:**

✅ **Success (200):**

```json
{
  "message": "Đã bỏ thích",
  "statusCode": 200,
  "status": "success"
}
```

---

## 🔍 Troubleshooting

### Lỗi 401 Unauthorized

**Nguyên nhân:**

- Chưa click Authorize
- Token sai format (thiếu "Bearer ")
- Token đã hết hạn
- Token không hợp lệ

**Giải pháp:**

1. Login lại để lấy token mới
2. Click Authorize và nhập: `Bearer <token>`
3. Đảm bảo có dấu cách giữa Bearer và token

### Lỗi 400 Bad Request

**Nguyên nhân:**

- `type` không đúng (phải là: post, comment, hoặc destination)
- `targetId` không tồn tại
- Đã like rồi (khi POST)
- Chưa like (khi DELETE)

**Giải pháp:**

- Check lại `type` value
- Check `targetId` có tồn tại không (GET destinations trước)
- Unlike trước khi like lại

### Lỗi 404 Not Found

**Nguyên nhân:**

- Destination/Post/Comment với `targetId` không tồn tại

**Giải pháp:**

- Lấy ID hợp lệ từ GET `/destinations` hoặc GET `/posts`

---

## 📝 Test Cases

### Test Case 1: Like một destination lần đầu

1. Login → Get token
2. Authorize với token
3. POST `/likes` với destination ID
4. Expect: 201 Created
5. GET `/destinations/:id` → Check `isLiked: true`

### Test Case 2: Unlike destination

1. Dùng destination đã like ở Test Case 1
2. DELETE `/likes` với cùng destination ID
3. Expect: 200 OK
4. GET `/destinations/:id` → Check `isLiked: false`

### Test Case 3: Like lại destination đã like

1. POST `/likes` với destination đã like
2. Expect: 400 Bad Request "Bạn đã thích địa điểm này rồi"

### Test Case 4: Unlike destination chưa like

1. DELETE `/likes` với destination chưa like
2. Expect: 400 Bad Request "Bạn chưa thích địa điểm này"

### Test Case 5: Like với type khác nhau

```json
// Like post
{ "targetId": "post-id", "type": "post" }

// Like comment
{ "targetId": "comment-id", "type": "comment" }

// Like destination
{ "targetId": "destination-id", "type": "destination" }
```

---

## 💡 Tips

### 1. Token tự động lưu

Swagger có option `persistAuthorization: true` nên token sẽ được lưu trong browser. Không cần authorize lại mỗi lần refresh page.

### 2. Check token có hợp lệ không

- Button Authorize có icon 🔒 (locked) → Token đã set
- Button Authorize có icon 🔓 (unlocked) → Chưa set token

### 3. Get destination ID để test

```
GET /destinations
→ Copy id từ response để dùng làm targetId
```

### 4. Kiểm tra kết quả

Sau khi like/unlike, check lại:

```
GET /destinations/:id
→ Xem field "isLiked" và "likeCount"
```

### 5. Test với Postman (Alternative)

Nếu Swagger không hoạt động, có thể dùng Postman:

- Header: `Authorization: Bearer <token>`
- Body: `{ "targetId": "...", "type": "..." }`

---

## ✅ Checklist

- [ ] Đã start server: `npm run start:dev`
- [ ] Đã mở Swagger: `http://localhost:3000/api`
- [ ] Đã login qua `/auth/login`
- [ ] Đã copy accessToken từ response
- [ ] Đã click Authorize button (góc trên phải)
- [ ] Đã nhập: `Bearer <token>` (có dấu cách)
- [ ] Đã click Authorize trong popup
- [ ] Đã close popup
- [ ] Button Authorize có icon 🔒
- [ ] Test POST `/likes` → Success 201
- [ ] Test DELETE `/likes` → Success 200

---

## 🎯 Expected Results

Sau khi setup đúng:

- ✅ POST `/likes` → 201 Created
- ✅ DELETE `/likes` → 200 OK
- ✅ Real-time socket events được emit
- ✅ Notification được tạo (nếu like người khác)
- ✅ `likeCount` được update
- ✅ `isLiked` field chính xác khi GET
