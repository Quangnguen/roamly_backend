# 🔐 Optional JWT Authentication - isLiked Feature

## 📋 Vấn đề

Khi user **chưa login**, các endpoint GET destinations trả về `isLiked: false` cho TẤT CẢ destinations, ngay cả khi user đã login trước đó và like rồi.

**Nguyên nhân:** Endpoint GET không có authentication guard → `req.user` luôn undefined → không query được likes của user.

## ✅ Giải pháp: OptionalJwtAuthGuard

Tạo guard mới cho phép endpoint hoạt động cả KHI CÓ và KHÔNG CÓ token.

### 1. OptionalJwtAuthGuard Implementation

**File:** `src/common/guard/optional-jwt-auth.guard.ts`

```typescript
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Không throw error nếu không có token
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null; // Trả về null thay vì throw error
    }
    return user;
  }

  // Luôn cho phép request tiếp tục
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean> | boolean;
  }
}
```

**Cách hoạt động:**

- ✅ **Có token hợp lệ:** `req.user` = user object → isLiked được tính đúng
- ✅ **Không có token:** `req.user` = null → isLiked = false cho tất cả
- ✅ **Token không hợp lệ:** `req.user` = null → isLiked = false cho tất cả

### 2. Apply vào Controller

**File:** `src/modules/destination/destination.controller.ts`

```typescript
@Get()
@UseGuards(OptionalJwtAuthGuard) // ← Thêm guard này
@ApiOperation({
  summary: 'Lấy danh sách địa điểm',
  description: 'Trả về isLiked=true nếu user đã login và đã like destination đó.',
})
getDestinations(@Query() searchDto: SearchDestinationDto, @Req() req: any) {
  const userId = req.user?.id; // ← userId có thể undefined
  return this.destinationService.getDestinations(searchDto, userId);
}

@Get(':id')
@UseGuards(OptionalJwtAuthGuard) // ← Thêm guard này
@ApiOperation({
  summary: 'Xem chi tiết địa điểm',
  description: 'Trả về isLiked=true nếu user đã login và đã like destination.',
})
getDestinationById(@Param('id') id: string, @Req() req: any) {
  const userId = req.user?.id; // ← userId có thể undefined
  return this.destinationService.getDestinationById(id, userId);
}
```

### 3. Service Logic

**File:** `src/modules/destination/destination.service.ts`

```typescript
async getDestinations(searchDto: SearchDestinationDto, userId?: string) {
  // ... fetch destinations ...

  // Add isLiked field for current user
  if (userId) {
    // User đã login → Query likes và tính isLiked
    const destinationIds = destinations.map((dest) => dest.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId,
        targetId: { in: destinationIds },
        type: 'destination',
      },
    });

    const likedDestinationIds = new Set(userLikes.map((like) => like.targetId));
    destinationsWithLikes = destinations.map((dest) => ({
      ...dest,
      isLiked: likedDestinationIds.has(dest.id), // ← true/false based on actual data
    }));
  } else {
    // User chưa login → isLiked = false cho tất cả
    destinationsWithLikes = destinations.map((dest) => ({
      ...dest,
      isLiked: false,
    }));
  }

  return response('...', 200, 'success', { destinations: destinationsWithLikes });
}
```

## 🎯 So sánh Guards

| Guard                    | Có token | Không có token      | Token invalid       |
| ------------------------ | -------- | ------------------- | ------------------- |
| **JwtAuthGuard**         | ✅ Pass  | ❌ 401 Error        | ❌ 401 Error        |
| **OptionalJwtAuthGuard** | ✅ Pass  | ✅ Pass (user=null) | ✅ Pass (user=null) |

## 📊 Flow Diagram

### Trường hợp 1: User đã login và có token

```
Request → OptionalJwtAuthGuard
            ↓
         Verify JWT Token ✅
            ↓
         req.user = { id: "user-123", ... }
            ↓
      Controller: userId = "user-123"
            ↓
      Service: Query likes WHERE userId = "user-123"
            ↓
      Response: isLiked = true/false (based on data)
```

### Trường hợp 2: User chưa login (không có token)

```
Request → OptionalJwtAuthGuard
            ↓
         No token → Don't throw error
            ↓
         req.user = null
            ↓
      Controller: userId = undefined
            ↓
      Service: Skip like query
            ↓
      Response: isLiked = false (for all)
```

## 🧪 Testing

### Test 1: Không có token (Public access)

**Request:**

```bash
curl http://localhost:3000/destinations
```

**Response:**

```json
{
  "destinations": [
    {
      "id": "dest-1",
      "title": "Hội An",
      "isLiked": false // ← Luôn false khi chưa login
    },
    {
      "id": "dest-2",
      "title": "Hạ Long",
      "isLiked": false // ← Luôn false khi chưa login
    }
  ]
}
```

### Test 2: Có token (Authenticated user)

**Request:**

```bash
curl http://localhost:3000/destinations \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**

```json
{
  "destinations": [
    {
      "id": "dest-1",
      "title": "Hội An",
      "isLiked": true // ← true nếu user đã like
    },
    {
      "id": "dest-2",
      "title": "Hạ Long",
      "isLiked": false // ← false nếu user chưa like
    }
  ]
}
```

### Test 3: Token không hợp lệ

**Request:**

```bash
curl http://localhost:3000/destinations \
  -H "Authorization: Bearer invalid-token"
```

**Response:** Vẫn 200 OK, nhưng isLiked = false cho tất cả (giống Test 1)

## 📝 Các endpoint áp dụng

✅ **GET `/destinations`** - Danh sách destinations

- Không có token → isLiked = false cho tất cả
- Có token → isLiked tính theo data thực

✅ **GET `/destinations/:id`** - Chi tiết destination

- Không có token → isLiked = false
- Có token → isLiked tính theo data thực

❌ **POST `/likes`** - Vẫn dùng JwtAuthGuard (bắt buộc login)
❌ **POST `/destinations`** - Vẫn dùng JwtAuthGuard + RolesGuard (chỉ Admin)

## 🔍 Debugging

### Check nếu guard hoạt động:

1. **Thêm log vào controller:**

```typescript
getDestinations(@Query() searchDto: SearchDestinationDto, @Req() req: any) {
  console.log('req.user:', req.user); // null nếu không có token
  const userId = req.user?.id;
  console.log('userId:', userId); // undefined nếu không có token
  return this.destinationService.getDestinations(searchDto, userId);
}
```

2. **Thêm log vào service:**

```typescript
async getDestinations(searchDto: SearchDestinationDto, userId?: string) {
  console.log('Service userId:', userId); // undefined nếu không login

  if (userId) {
    console.log('Querying likes for user:', userId);
    // Query likes...
  } else {
    console.log('No userId - returning isLiked=false for all');
  }
}
```

3. **Test trong Swagger:**
   - **Không Authorize:** isLiked = false cho tất cả
   - **Có Authorize:** isLiked = true/false dựa trên data

## ⚠️ Lưu ý

1. **OptionalJwtAuthGuard** chỉ dùng cho endpoints READ (GET)
2. **JwtAuthGuard** vẫn dùng cho endpoints WRITE (POST, PATCH, DELETE)
3. Service phải handle cả trường hợp `userId` là `undefined`
4. Frontend nên luôn gửi token nếu có để hiển thị đúng trạng thái like

## 🚀 Benefits

✅ **SEO Friendly:** Public endpoints vẫn accessible
✅ **Better UX:** User chưa login vẫn xem được destinations
✅ **Accurate State:** User đã login thấy chính xác destinations đã like
✅ **No Breaking Changes:** Không ảnh hưởng endpoints khác
