import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('trip')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new CustomValidationPipe())
export class TripController {

    constructor(private readonly tripService: TripService) {}

    @Post('create')
    @UseInterceptors(FilesInterceptor('images'))
    @Roles(Role.User, Role.Admin)
    createTrip(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateTripDto,
        @Req() req: any,
    ) {
        const authorId = req.user.id;
        return this.tripService.createTrip(authorId, files, dto);
    }
    
}
