import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { Public } from './public.decorator.js';
import type { AuthedRequest } from './session.guard.js';
import { clearSessionCookie, setSessionCookie } from './session-cookie.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, expiresAt, user } = await this.auth.login(dto);
    setSessionCookie(response, token, new Date(expiresAt));
    // The token stays out of the body: page scripts never see it.
    return { expiresAt, user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthedRequest, @Res({ passthrough: true }) response: Response): Promise<void> {
    if (request.sessionToken) await this.auth.logout(request.sessionToken);
    clearSessionCookie(response);
  }

  @Get('me')
  me(@Req() request: AuthedRequest) {
    return request.user;
  }

  @Patch('me')
  updateProfile(@Req() request: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(request.user!.id, dto);
  }

  @Post('password')
  @HttpCode(204)
  changePassword(@Req() request: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(request.user!.id, dto, request.sessionToken!);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteAccount(@Req() request: AuthedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.deleteAccount(request.user!.id);
    clearSessionCookie(response);
  }
}
