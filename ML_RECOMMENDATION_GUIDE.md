# 🤖 ML Recommendation System - Complete Guide

## 📊 Overview

Hệ thống recommendation dựa trên **User Behavior & Preferences** từ app, sử dụng:

- **Content-Based Filtering**: Dựa trên đặc điểm destinations
- **Collaborative Filtering**: Dựa trên hành vi users tương tự
- **Hybrid Approach**: Kết hợp cả 2 methods

---

## 🎯 Data Sources

### 1. **User Features**

```json
{
  "userId": "uuid",
  "username": "john_doe",
  "bio": "Love traveling and photography",
  "postCount": 25,
  "likeCount": 150,
  "viewCount": 500,
  "favoriteCategories": ["Beach", "Mountain", "Cultural"],
  "favoriteCities": ["Hoi An", "Da Nang", "Sapa"],
  "favoriteCountries": ["Vietnam", "Thailand"],
  "avgRating": 4.5
}
```

### 2. **Destination Features**

```json
{
  "destinationId": "uuid",
  "title": "Hoi An Ancient Town",
  "description": "Historic town with beautiful architecture",
  "category": ["Cultural", "Historical"],
  "tags": ["UNESCO", "Old Town", "Lanterns"],
  "city": "Hoi An",
  "country": "Vietnam",
  "activities": ["Walking Tour", "Photography", "Shopping"],
  "facilities": ["Restaurant", "Hotel", "ATM"],
  "rating": 4.7,
  "likeCount": 1200,
  "visitCount": 5000,
  "reviewCount": 350
}
```

### 3. **Interactions**

```json
{
  "userId": "uuid",
  "destinationId": "uuid",
  "interactionType": "view|like|post|review",
  "timestamp": "2025-10-03T10:30:00Z",
  "rating": 4.5 // Optional, for reviews
}
```

---

## 🚀 Step-by-Step Implementation

### **STEP 1: Export Data từ App**

```bash
# Call API để export data (Admin only)
POST http://localhost:8686/destinations/ml/export-data
Headers:
  Authorization: Bearer <admin-token>

# Kết quả: Files được tạo trong ml-exports/
ml-exports/
├── users_2025-10-03T15-30-00.json
├── destinations_2025-10-03T15-30-00.json
└── interactions_2025-10-03T15-30-00.json
```

---

### **STEP 2: Upload lên Google Colab**

#### **2.1. Open Colab Notebook**

https://colab.research.google.com/

#### **2.2. Upload Files**

```python
from google.colab import files
import json
import pandas as pd

# Upload 3 files JSON
uploaded = files.upload()

# Load data
users_df = pd.read_json('users_2025-10-03T15-30-00.json')
destinations_df = pd.read_json('destinations_2025-10-03T15-30-00.json')
interactions_df = pd.read_json('interactions_2025-10-03T15-30-00.json')

print(f"Users: {len(users_df)}")
print(f"Destinations: {len(destinations_df)}")
print(f"Interactions: {len(interactions_df)}")
```

---

### **STEP 3: Train Model**

#### **3.1. Content-Based Model**

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Combine destination features
destinations_df['combined_features'] = (
    destinations_df['title'] + ' ' +
    destinations_df['description'] + ' ' +
    destinations_df['category'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '') + ' ' +
    destinations_df['tags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '') + ' ' +
    destinations_df['activities'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '') + ' ' +
    destinations_df['city'] + ' ' +
    destinations_df['country']
)

# TF-IDF
tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
tfidf_matrix = tfidf.fit_transform(destinations_df['combined_features'])

# Cosine Similarity
similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

print(f"Similarity Matrix: {similarity_matrix.shape}")
```

#### **3.2. User-Based Collaborative Filtering**

```python
# Create User-Item interaction matrix
interaction_weights = {
    'view': 1,
    'like': 3,
    'post': 5,
    'review': 4
}

interactions_df['weight'] = interactions_df['interactionType'].map(interaction_weights)

# Pivot table
user_item_matrix = interactions_df.pivot_table(
    index='userId',
    columns='destinationId',
    values='weight',
    aggfunc='sum',
    fill_value=0
)

print(f"User-Item Matrix: {user_item_matrix.shape}")

# User similarity
from sklearn.metrics.pairwise import cosine_similarity
user_similarity = cosine_similarity(user_item_matrix)
```

#### **3.3. Hybrid Model**

```python
def get_hybrid_recommendations(user_id, user_profile, top_n=10):
    """
    Hybrid: Content-Based + Collaborative Filtering + Popularity
    """
    recommendations = {}

    # 1. Content-Based: Based on liked destinations
    if user_profile['likedDestinationIds']:
        liked_indices = [
            destinations_df[destinations_df['destinationId'] == dest_id].index[0]
            for dest_id in user_profile['likedDestinationIds']
            if dest_id in destinations_df['destinationId'].values
        ]

        if liked_indices:
            content_scores = similarity_matrix[liked_indices].mean(axis=0)
            for idx, score in enumerate(content_scores):
                dest_id = destinations_df.iloc[idx]['destinationId']
                recommendations[dest_id] = {'content': score, 'collab': 0, 'popularity': 0}

    # 2. Collaborative Filtering: Similar users
    if user_id in user_item_matrix.index:
        user_idx = user_item_matrix.index.get_loc(user_id)
        similar_users = np.argsort(user_similarity[user_idx])[::-1][1:21]  # Top 20 similar

        collab_scores = user_item_matrix.iloc[similar_users].mean(axis=0)
        for dest_id, score in collab_scores.items():
            if dest_id not in recommendations:
                recommendations[dest_id] = {'content': 0, 'collab': 0, 'popularity': 0}
            recommendations[dest_id]['collab'] = score

    # 3. Popularity Score
    for idx, row in destinations_df.iterrows():
        dest_id = row['destinationId']
        popularity = (
            row['likeCount'] * 0.4 +
            row['visitCount'] * 0.3 +
            row['reviewCount'] * 0.3
        )
        if dest_id not in recommendations:
            recommendations[dest_id] = {'content': 0, 'collab': 0, 'popularity': 0}
        recommendations[dest_id]['popularity'] = popularity

    # 4. Weighted combination
    final_scores = {}
    for dest_id, scores in recommendations.items():
        # Exclude already interacted destinations
        if dest_id in user_profile['likedDestinationIds']:
            continue
        if dest_id in user_profile['viewedDestinationIds']:
            continue

        final_score = (
            scores['content'] * 0.4 +
            scores['collab'] * 0.35 +
            scores['popularity'] * 0.25
        )
        final_scores[dest_id] = final_score

    # Sort and return top N
    sorted_recommendations = sorted(
        final_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_n]

    return [
        {
            'destinationId': dest_id,
            'score': score,
            **destinations_df[destinations_df['destinationId'] == dest_id].iloc[0].to_dict()
        }
        for dest_id, score in sorted_recommendations
    ]
```

---

### **STEP 4: Save Model**

```python
import pickle

model_data = {
    'tfidf_vectorizer': tfidf,
    'tfidf_matrix': tfidf_matrix,
    'similarity_matrix': similarity_matrix,
    'user_item_matrix': user_item_matrix,
    'user_similarity': user_similarity,
    'destinations': destinations_df.to_dict('records'),
    'destination_id_to_idx': {
        dest_id: idx
        for idx, dest_id in enumerate(destinations_df['destinationId'])
    }
}

with open('travel_recommender_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ Model saved!")

# Download
from google.colab import files
files.download('travel_recommender_model.pkl')
```

---

### **STEP 5: Create FastAPI Service**

Tạo Python service để serve model (xem file riêng: `PYTHON_ML_SERVICE.md`)

---

### **STEP 6: Integrate vào NestJS**

```typescript
// destination.service.ts
async getAIRecommendations(userId: string, limit = 10) {
  // 1. Get user profile
  const profile = await this.mlDataExportService.getUserProfile(userId);

  // 2. Call Python ML service
  const response = await fetch('http://localhost:5000/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      user_profile: profile,
      limit
    })
  });

  const mlRecommendations = await response.json();

  // 3. Enrich với data từ DB + isLiked
  const destinationIds = mlRecommendations.map(r => r.destinationId);
  const destinations = await this.prisma.destination.findMany({
    where: { id: { in: destinationIds } },
    include: { user: { select: { username: true, profilePic: true } } }
  });

  // Add isLiked
  const userLikes = await this.prisma.like.findMany({
    where: { userId, targetId: { in: destinationIds }, type: 'destination' }
  });
  const likedSet = new Set(userLikes.map(l => l.targetId));

  return destinations.map(dest => ({
    ...dest,
    isLiked: likedSet.has(dest.id),
    ml_score: mlRecommendations.find(r => r.destinationId === dest.id)?.score || 0
  })).sort((a, b) => b.ml_score - a.ml_score);
}
```

---

## 📈 Testing

```bash
# 1. Export data
POST /destinations/ml/export-data

# 2. Train model trên Colab

# 3. Start Python service
cd python-ml-service
python app.py

# 4. Test recommendations
GET /destinations/recommendations/ai?limit=10
Headers:
  Authorization: Bearer <user-token>
```

---

## 🎯 Expected Results

```json
{
  "message": "AI recommendations retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "dest-uuid-1",
      "title": "Tam Coc",
      "city": "Ninh Binh",
      "category": ["Nature", "Scenic"],
      "rating": 4.6,
      "isLiked": false,
      "ml_score": 0.87,
      "reason": "Similar to Trang An that you liked"
    }
    // ... more recommendations
  ]
}
```

---

## 📝 Notes

- **Cold Start Problem**: Users mới dùng Popular destinations
- **Model Update**: Retrain model mỗi tuần/tháng với data mới
- **A/B Testing**: So sánh ML recommendations vs rule-based
- **Monitoring**: Track CTR (Click-Through Rate) của recommendations

---

## 🔄 Next Steps

1. ✅ Export data API
2. ✅ Colab notebook (xem file riêng)
3. ✅ Train model
4. ⏳ Python FastAPI service
5. ⏳ NestJS integration
6. ⏳ Deploy & monitor
