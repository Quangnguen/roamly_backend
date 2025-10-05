import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface UserFeature {
  userId: string;
  username: string;
  // Preferences
  bio?: string;
  // Activity counts
  postCount: number;
  likeCount: number;
  viewCount: number;
  // Favorite categories (từ destinations đã like/view)
  favoriteCategories: string[];
  favoriteCities: string[];
  favoriteCountries: string[];
  // Average ratings given
  avgRating: number;
}

interface DestinationFeature {
  destinationId: string;
  title: string;
  description: string;
  category: string[];
  tags: string[];
  city: string;
  country: string;
  activities: string[];
  facilities: string[];
  rating: number;
  likeCount: number;
  visitCount: number;
  reviewCount: number;
}

interface Interaction {
  userId: string;
  destinationId: string;
  interactionType: 'view' | 'like' | 'post' | 'review';
  timestamp: Date;
  rating?: number;
}

@Injectable()
export class MLDataExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export all data for ML training
   */
  async exportTrainingData() {
    console.log('📊 Starting data export for ML training...');

    const [users, destinations, interactions] = await Promise.all([
      this.exportUserFeatures(),
      this.exportDestinationFeatures(),
      this.exportInteractions(),
    ]);

    // Save to JSON files
    const exportDir = path.join(process.cwd(), 'ml-exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    fs.writeFileSync(
      path.join(exportDir, `users_${timestamp}.json`),
      JSON.stringify(users, null, 2),
    );

    fs.writeFileSync(
      path.join(exportDir, `destinations_${timestamp}.json`),
      JSON.stringify(destinations, null, 2),
    );

    fs.writeFileSync(
      path.join(exportDir, `interactions_${timestamp}.json`),
      JSON.stringify(interactions, null, 2),
    );

    console.log('✅ Data exported successfully to ml-exports/');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Destinations: ${destinations.length}`);
    console.log(`   - Interactions: ${interactions.length}`);

    return {
      users,
      destinations,
      interactions,
      exportDir,
      timestamp,
    };
  }

  /**
   * Export user features
   */
  private async exportUserFeatures(): Promise<UserFeature[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        bio: true,
        posts: {
          select: { id: true },
        },
        likes: {
          where: { type: 'destination' },
          select: { targetId: true },
        },
        destinationViews: {
          select: { destinationId: true },
        },
        destinationReviews: {
          select: { rating: true },
        },
      },
    });

    const userFeatures: UserFeature[] = [];

    for (const user of users) {
      // Get liked/viewed destination details
      const destinationIds = [
        ...user.likes.map((l) => l.targetId),
        ...user.destinationViews.map((v) => v.destinationId),
      ];

      const destinations = await this.prisma.destination.findMany({
        where: { id: { in: destinationIds } },
        select: {
          category: true,
          city: true,
          country: true,
        },
      });

      // Extract favorite categories/cities/countries
      const categories = destinations.flatMap((d) => d.category);
      const cities = destinations.map((d) => d.city);
      const countries = destinations.map((d) => d.country);

      const avgRating =
        user.destinationReviews.length > 0
          ? user.destinationReviews.reduce((sum, r) => sum + r.rating, 0) /
            user.destinationReviews.length
          : 0;

      userFeatures.push({
        userId: user.id,
        username: user.username,
        bio: user.bio || '',
        postCount: user.posts.length,
        likeCount: user.likes.length,
        viewCount: user.destinationViews.length,
        favoriteCategories: [...new Set(categories)],
        favoriteCities: [...new Set(cities)],
        favoriteCountries: [...new Set(countries)],
        avgRating,
      });
    }

    return userFeatures;
  }

  /**
   * Export destination features
   */
  private async exportDestinationFeatures(): Promise<DestinationFeature[]> {
    const destinations = await this.prisma.destination.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        city: true,
        country: true,
        activities: true,
        facilities: true,
        rating: true,
        likeCount: true,
        visitCount: true,
        reviewCount: true,
      },
    });

    return destinations.map((d) => ({
      destinationId: d.id,
      title: d.title,
      description: d.description || '',
      category: d.category,
      tags: d.tags,
      city: d.city,
      country: d.country,
      activities: d.activities,
      facilities: d.facilities,
      rating: d.rating,
      likeCount: d.likeCount,
      visitCount: d.visitCount,
      reviewCount: d.reviewCount,
    }));
  }

  /**
   * Export user-destination interactions
   */
  private async exportInteractions(): Promise<Interaction[]> {
    const interactions: Interaction[] = [];

    // 1. Views
    const views = await this.prisma.destinationView.findMany({
      select: {
        userId: true,
        destinationId: true,
        viewedAt: true,
      },
    });
    interactions.push(
      ...views.map((v) => ({
        userId: v.userId,
        destinationId: v.destinationId,
        interactionType: 'view' as const,
        timestamp: v.viewedAt,
      })),
    );

    // 2. Likes
    const likes = await this.prisma.like.findMany({
      where: { type: 'destination' },
      select: {
        userId: true,
        targetId: true,
        createdAt: true,
      },
    });
    interactions.push(
      ...likes.map((l) => ({
        userId: l.userId,
        destinationId: l.targetId,
        interactionType: 'like' as const,
        timestamp: l.createdAt,
      })),
    );

    // 3. Posts with tagged destinations
    const posts = await this.prisma.post.findMany({
      select: {
        authorId: true,
        createdAt: true,
        taggedDestinations: {
          select: {
            destinationId: true,
          },
        },
      },
    });
    for (const post of posts) {
      for (const tagged of post.taggedDestinations) {
        interactions.push({
          userId: post.authorId,
          destinationId: tagged.destinationId,
          interactionType: 'post',
          timestamp: post.createdAt,
        });
      }
    }

    // 4. Reviews
    const reviews = await this.prisma.destinationReview.findMany({
      select: {
        userId: true,
        destinationId: true,
        rating: true,
        createdAt: true,
      },
    });
    interactions.push(
      ...reviews.map((r) => ({
        userId: r.userId,
        destinationId: r.destinationId,
        interactionType: 'review' as const,
        timestamp: r.createdAt,
        rating: r.rating,
      })),
    );

    return interactions;
  }

  /**
   * Get user profile for recommendation
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get interaction history
    const [views, likes, reviews, posts] = await Promise.all([
      this.prisma.destinationView.findMany({
        where: { userId },
        include: {
          destination: {
            select: { id: true, category: true, city: true, country: true },
          },
        },
        orderBy: { viewedAt: 'desc' },
        take: 50,
      }),
      this.prisma.like.findMany({
        where: { userId, type: 'destination' },
        select: { targetId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.destinationReview.findMany({
        where: { userId },
        select: { destinationId: true, rating: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.post.findMany({
        where: { authorId: userId },
        include: {
          taggedDestinations: {
            include: {
              destination: { select: { id: true, category: true, city: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Extract liked destination IDs
    const likedDestinations = await this.prisma.destination.findMany({
      where: { id: { in: likes.map((l) => l.targetId) } },
      select: {
        id: true,
        category: true,
        tags: true,
        city: true,
        country: true,
      },
    });

    // Extract categories, cities from all interactions
    const allCategories = [
      ...views.flatMap((v) => v.destination.category),
      ...likedDestinations.flatMap((d) => d.category),
      ...posts.flatMap((p) =>
        p.taggedDestinations.flatMap((t) => t.destination.category),
      ),
    ];

    const allCities = [
      ...views.map((v) => v.destination.city),
      ...likedDestinations.map((d) => d.city),
    ];

    const allCountries = [
      ...views.map((v) => v.destination.country),
      ...likedDestinations.map((d) => d.country),
    ];

    return {
      userId: user.id,
      username: user.username,
      bio: user.bio,
      likedDestinationIds: likes.map((l) => l.targetId),
      viewedDestinationIds: views.map((v) => v.destinationId),
      reviewedDestinationIds: reviews.map((r) => r.destinationId),
      postedDestinationIds: posts.flatMap((p) =>
        p.taggedDestinations.map((t) => t.destinationId),
      ),
      favoriteCategories: [...new Set(allCategories)],
      favoriteCities: [...new Set(allCities)],
      favoriteCountries: [...new Set(allCountries)],
      avgRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
    };
  }
}
