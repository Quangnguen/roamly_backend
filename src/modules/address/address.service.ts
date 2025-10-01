/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { SearchAddressDto } from './dto/search-address.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class AddressService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    dto: CreateAddressDto,
    userId?: string,
    images?: Express.Multer.File[],
  ) {
    // Kiểm tra slug đã tồn tại chưa
    const existingAddress = await this.prisma.address.findUnique({
      where: { slug: dto.slug },
    });

    if (existingAddress) {
      throw new ConflictException('Slug này đã tồn tại');
    }

    // Kiểm tra parentId hợp lệ
    if (dto.parentId) {
      const parent = await this.prisma.address.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Không tìm thấy địa chỉ cha');
      }

      // Kiểm tra level hợp lệ (level con phải lớn hơn level cha)
      if (dto.level <= parent.level) {
        throw new BadRequestException(
          'Level phải lớn hơn level của địa chỉ cha',
        );
      }
    }

    // Tạo path từ parent
    let path = dto.path || [];
    if (dto.parentId) {
      const parent = await this.prisma.address.findUnique({
        where: { id: dto.parentId },
        select: { path: true },
      });
      path = [...(parent?.path || []), dto.slug];
    } else {
      path = [dto.slug];
    }

    // Handle image uploads
    let finalImages = dto.images || [];
    let finalCoverImage = dto.coverImage;

    if (images && images.length > 0) {
      const uploadPromises = images.map(async (image) => {
        const result = await this.cloudinaryService.uploadImage(image);
        return result.secure_url;
      });
      const uploadedImageUrls = await Promise.all(uploadPromises);
      finalImages = [...finalImages, ...uploadedImageUrls];

      // Set first uploaded image as cover if no cover image provided
      if (!finalCoverImage && uploadedImageUrls.length > 0) {
        finalCoverImage = uploadedImageUrls[0];
      }
    }

    const address = await this.prisma.address.create({
      data: {
        name: dto.name,
        fullName: dto.fullName,
        nameEn: dto.nameEn,
        slug: dto.slug,
        type: dto.type as any,
        latitude: dto.latitude,
        longitude: dto.longitude,
        area: dto.area,
        population: dto.population,
        description: dto.description,
        shortDesc: dto.shortDesc,
        highlights: dto.highlights,
        coverImage: finalCoverImage,
        images: finalImages,
        bestTimeToVisit: dto.bestTimeToVisit,
        climate: dto.climate,
        famousFor: dto.famousFor,
        parentId: dto.parentId,
        level: dto.level,
        path,
        isActive: dto.isActive,
        isPriority: dto.isPriority,
        createdById: userId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            destinationCount: true,
          },
        },
        _count: {
          select: {
            destinations: true,
            homestays: true,
          },
        },
      },
    });

    return response('Tạo địa chỉ thành công', 200, 'success', address);
  }

  async findAll(dto: SearchAddressDto) {
    const {
      q,
      type,
      parentId,
      level,
      isActive,
      isPriority,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = dto;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Tìm kiếm theo tên
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Lọc theo type
    if (type) {
      where.type = type;
    }

    // Lọc theo parent
    if (parentId) {
      where.parentId = parentId;
    }

    // Lọc theo level
    if (level !== undefined) {
      where.level = level;
    }

    // Lọc theo trạng thái
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPriority !== undefined) {
      where.isPriority = isPriority;
    }

    // Sắp xếp
    const orderBy: any = {};
    if (sortBy === 'destinationCount') {
      orderBy.destinationCount = sortOrder;
    } else if (sortBy === 'viewCount') {
      orderBy.viewCount = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [addresses, total] = await Promise.all([
      this.prisma.address.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
          _count: {
            select: {
              destinations: true,
              homestays: true,
              children: true,
            },
          },
        },
      }),
      this.prisma.address.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return response('Lấy danh sách địa chỉ thành công', 200, 'success', {
      addresses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            destinationCount: true,
            homestayCount: true,
          },
          orderBy: { name: 'asc' },
        },
        destinations: {
          take: 10,
          select: {
            id: true,
            name: true,
            shortDesc: true,
            coverImage: true,
            rating: true,
            reviewCount: true,
            category: true,
          },
          where: { status: 'ACTIVE' },
          orderBy: { rating: 'desc' },
        },
        homestays: {
          take: 10,
          select: {
            id: true,
            title: true,
            shortDesc: true,
            coverImage: true,
            pricePerNight: true,
            rating: true,
            reviewCount: true,
            type: true,
          },
          where: { isActive: true },
          orderBy: { rating: 'desc' },
        },
        _count: {
          select: {
            destinations: true,
            homestays: true,
            children: true,
          },
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Tăng view count
    await this.prisma.address.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return response(
      'Lấy thông tin địa chỉ thành công',
      200,
      'success',
      address,
    );
  }

  async findBySlug(slug: string) {
    const address = await this.prisma.address.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            destinationCount: true,
            homestayCount: true,
          },
          orderBy: { name: 'asc' },
        },
        destinations: {
          take: 10,
          select: {
            id: true,
            name: true,
            shortDesc: true,
            coverImage: true,
            rating: true,
            reviewCount: true,
            category: true,
          },
          where: { status: 'ACTIVE' },
          orderBy: { rating: 'desc' },
        },
        homestays: {
          take: 10,
          select: {
            id: true,
            title: true,
            shortDesc: true,
            coverImage: true,
            pricePerNight: true,
            rating: true,
            reviewCount: true,
            type: true,
          },
          where: { isActive: true },
          orderBy: { rating: 'desc' },
        },
        _count: {
          select: {
            destinations: true,
            homestays: true,
            children: true,
          },
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Tăng view count và search count
    await this.prisma.address.update({
      where: { slug },
      data: {
        viewCount: { increment: 1 },
        searchCount: { increment: 1 },
      },
    });

    return response(
      'Lấy thông tin địa chỉ thành công',
      200,
      'success',
      address,
    );
  }

  async update(id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Kiểm tra slug nếu có thay đổi
    if (dto.slug && dto.slug !== address.slug) {
      const existingAddress = await this.prisma.address.findUnique({
        where: { slug: dto.slug },
      });

      if (existingAddress) {
        throw new ConflictException('Slug này đã tồn tại');
      }
    }

    // Kiểm tra parentId nếu có thay đổi
    if (dto.parentId && dto.parentId !== address.parentId) {
      const parent = await this.prisma.address.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Không tìm thấy địa chỉ cha');
      }

      if (dto.level !== undefined && dto.level <= parent.level) {
        throw new BadRequestException(
          'Level phải lớn hơn level của địa chỉ cha',
        );
      }
    }

    // Cập nhật path nếu slug hoặc parent thay đổi
    const updateData: any = { ...dto };
    if (dto.slug || dto.parentId) {
      let path = dto.path || address.path;
      if (dto.parentId) {
        const parent = await this.prisma.address.findUnique({
          where: { id: dto.parentId },
          select: { path: true },
        });
        path = [...(parent?.path || []), dto.slug || address.slug];
      } else if (dto.slug) {
        path = [dto.slug];
      }
      updateData.path = path;
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            destinationCount: true,
          },
        },
        _count: {
          select: {
            destinations: true,
            homestays: true,
          },
        },
      },
    });

    return response(
      'Cập nhật địa chỉ thành công',
      200,
      'success',
      updatedAddress,
    );
  }

  async remove(id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: {
        children: true,
        destinations: true,
        homestays: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Kiểm tra có địa chỉ con không
    if (address.children.length > 0) {
      throw new BadRequestException('Không thể xóa địa chỉ có địa chỉ con');
    }

    // Kiểm tra có destination hoặc homestay không
    if (address.destinations.length > 0 || address.homestays.length > 0) {
      throw new BadRequestException(
        'Không thể xóa địa chỉ có địa điểm hoặc homestay',
      );
    }

    await this.prisma.address.delete({
      where: { id },
    });

    return response('Xóa địa chỉ thành công', 200, 'success', null);
  }

  async getHierarchy(id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: { path: true, level: true },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Lấy tất cả địa chỉ trong path
    const hierarchy = await this.prisma.address.findMany({
      where: {
        slug: { in: address.path },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        level: true,
      },
      orderBy: { level: 'asc' },
    });

    return response(
      'Lấy cây phân cấp địa chỉ thành công',
      200,
      'success',
      hierarchy,
    );
  }

  async getPopular(limit: number = 10) {
    const addresses = await this.prisma.address.findMany({
      where: {
        isActive: true,
        isPriority: true,
      },
      take: limit,
      orderBy: [
        { destinationCount: 'desc' },
        { viewCount: 'desc' },
        { searchCount: 'desc' },
      ],
      include: {
        _count: {
          select: {
            destinations: true,
            homestays: true,
          },
        },
      },
    });

    return response(
      'Lấy danh sách địa chỉ phổ biến thành công',
      200,
      'success',
      addresses,
    );
  }

  async uploadImages(
    id: string,
    images: Express.Multer.File[],
    userId: string,
  ) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Kiểm tra quyền (chỉ người tạo hoặc admin mới được upload)
    if (address.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền upload ảnh cho địa chỉ này',
      );
    }

    if (!images || images.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một ảnh');
    }

    // Upload ảnh lên Cloudinary
    const uploadPromises = images.map(async (image) => {
      const result = await this.cloudinaryService.uploadImage(image);
      return result.secure_url;
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    // Cập nhật danh sách ảnh của địa chỉ
    const currentImages = address.images || [];
    const newImages = [...currentImages, ...uploadedImageUrls];

    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: {
        images: newImages,
        // Nếu chưa có cover image, set ảnh đầu tiên làm cover
        ...(!address.coverImage &&
          uploadedImageUrls.length > 0 && {
            coverImage: uploadedImageUrls[0],
          }),
      },
    });

    return response('Upload ảnh thành công', 200, 'success', {
      uploadedImages: uploadedImageUrls,
      totalImages: newImages.length,
      coverImage: updatedAddress.coverImage,
    });
  }

  async updateImages(
    id: string,
    images: string[],
    coverImage?: string,
    userId?: string,
  ) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Kiểm tra quyền (chỉ người tạo hoặc admin mới được cập nhật)
    if (userId && address.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật ảnh cho địa chỉ này',
      );
    }

    // Validate coverImage phải nằm trong danh sách images
    if (coverImage && !images.includes(coverImage)) {
      throw new BadRequestException('Ảnh cover phải nằm trong danh sách ảnh');
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: {
        images,
        coverImage: coverImage || address.coverImage,
      },
      include: {
        _count: {
          select: {
            destinations: true,
            homestays: true,
          },
        },
      },
    });

    return response('Cập nhật ảnh thành công', 200, 'success', updatedAddress);
  }

  async deleteImage(id: string, imageUrl: string, userId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    // Kiểm tra quyền (chỉ người tạo hoặc admin mới được xóa)
    if (address.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền xóa ảnh cho địa chỉ này',
      );
    }

    const currentImages = address.images || [];

    if (!currentImages.includes(imageUrl)) {
      throw new NotFoundException('Không tìm thấy ảnh trong danh sách');
    }

    // Xóa ảnh khỏi danh sách
    const newImages = currentImages.filter((img) => img !== imageUrl);

    // Nếu ảnh bị xóa là cover image, set cover image mới
    let newCoverImage = address.coverImage;
    if (address.coverImage === imageUrl) {
      newCoverImage = newImages.length > 0 ? newImages[0] : null;
    }

    // Xóa ảnh từ Cloudinary
    try {
      await this.cloudinaryService.deleteImage(imageUrl);
    } catch (error) {
      // Log error nhưng vẫn tiếp tục cập nhật database
      console.error('Không thể xóa ảnh từ Cloudinary:', error);
    }

    await this.prisma.address.update({
      where: { id },
      data: {
        images: newImages,
        coverImage: newCoverImage,
      },
    });

    return response('Xóa ảnh thành công', 200, 'success', {
      deletedImage: imageUrl,
      remainingImages: newImages,
      newCoverImage: newCoverImage,
    });
  }
}
