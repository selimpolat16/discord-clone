import { Controller, Post, Body } from '@nestjs/common';

interface LoginDto {
  username: string;
}

@Controller('api/auth')
export class AuthController {
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      // Basit bir response dönelim
      return {
        message: 'Login successful',
        user: loginDto.username
      };
    } catch (error) {
      throw error;
    }
  }
} 