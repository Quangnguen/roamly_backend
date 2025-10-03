# 🏷️ Post Destination Tagging - Setup Guide

## Đã thực hiện:

### 1. ✅ Schema Changes (prisma/schema.prisma)

- Thêm model `PostDestination` để map nhiều-nhiều giữa Post và Destination
- Thêm relation `taggedDestinations` vào Post
- Thêm relation `taggedInPosts` vào Destination

### 2. ✅ DTO Updates

- `CreatePostDto`: Thêm field `taggedDestinations?: string[]`
- `UpdatePostDto`: Thêm field `taggedDestinations?: string[]`

### 3. ✅ Service Updates (post.service.ts)

- `create()`: Tạo PostDestination records khi tạo post
- `update()`: Cập nhật tagged destinations khi update post
- `findAll()`: Include taggedDestinations với thông tin destination
- `findById()`: Include taggedDestinations với thông tin destination
- `getPostsByUserId()`: Include taggedDestinations với thông tin destination

---

## 🚀 Các bước cần thực hiện:

### Bước 1: Generate Prisma Client

```powershell
npx prisma generate
```

### Bước 2: Push schema to MongoDB

```powershell
npx prisma db push
```

### Bước 3: Restart dev server

```powershell
npm run start:dev
```

---

## 📝 Cách sử dụng API:

### 1. Tạo Post với tagged destinations

**POST** `/posts`

```typescript
// Form-data
{
  caption: "Du lịch Ninh Bình tuyệt vời!",
  images: [file1, file2],
  taggedDestinations: ["destination-id-1", "destination-id-2"]
}
```

### 2. Update Post với tagged destinations

**PATCH** `/posts/:id`

```typescript
// Form-data
{
  caption: "Updated caption",
  taggedDestinations: ["destination-id-3", "destination-id-4"]
  // Nếu không gửi taggedDestinations thì giữ nguyên
  // Nếu gửi [] thì xóa hết tags
  // Nếu gửi array thì replace hết
}
```

### 3. Response format

```json
{
  "message": "Tạo bài viết thành công",
  "statusCode": 201,
  "status": "success",
  "data": {
    "id": "post-id",
    "caption": "Du lịch Ninh Bình tuyệt vời!",
    "imageUrl": ["url1", "url2"],
    "taggedDestinations": [
      {
        "id": "tag-id",
        "postId": "post-id",
        "destinationId": "destination-id-1",
        "destination": {
          "id": "destination-id-1",
          "title": "Tràng An",
          "location": "Ninh Bình",
          "city": "Ninh Bình",
          "country": "Vietnam",
          "imageUrl": ["url"]
        }
      }
    ]
  }
}
```

---

## 🎯 Lợi ích:

1. **Gắn thẻ địa điểm**: User có thể tag destinations vào post như Facebook/Instagram
2. **Tìm kiếm dễ dàng**: Có thể query tất cả posts gắn với một destination
3. **Tăng engagement**: User khám phá địa điểm qua posts của người khác
4. **Analytics**: Biết destination nào được mention nhiều nhất

---

## 📊 Database Structure:

```
posts (collection)
├── id
├── caption
├── imageUrl[]
└── taggedDestinations (relation)

post_destinations (collection)
├── id
├── postId → Post
├── destinationId → Destination
└── @@unique([postId, destinationId])

destinations (collection)
├── id
├── title
├── location
└── taggedInPosts (relation)
```

---

## 🔍 Query Examples (Future features):

### Lấy tất cả posts gắn với một destination:

```typescript
const posts = await prisma.post.findMany({
  where: {
    taggedDestinations: {
      some: {
        destinationId: 'destination-id',
      },
    },
  },
});
```

### Lấy top destinations được tag nhiều nhất:

```typescript
const topDestinations = await prisma.postDestination.groupBy({
  by: ['destinationId'],
  _count: { destinationId: true },
  orderBy: { _count: { destinationId: 'desc' } },
  take: 10,
});
```
