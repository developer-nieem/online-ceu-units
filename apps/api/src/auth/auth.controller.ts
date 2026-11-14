import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthCookiesService } from './auth-cookies.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CsrfGuard } from './guards/csrf.guard';
import type { AuthUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookiesService,
  ) {}

  @Public()
  @Get('csrf')
  getCsrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = this.cookies.issueCsrfToken(res);
    return { csrfToken, header: this.cookies.getCsrfHeaderName() };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CsrfGuard)
  @Post('signup')
  signup(@Body() dto: SignupDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.signup(dto, req, res);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(CsrfGuard)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, req, res);
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getSession(user);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CsrfGuard)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, req);
  }

  @Public()
  @Get('verify-email')
  verifyEmailGet(@Query('token') token: string | undefined, @Req() req: Request) {
    return this.authService.verifyEmailQuery(token, req);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto.token, req);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CsrfGuard)
  @Post('send-verification-email')
  sendVerificationEmail(@CurrentUser() user: AuthUser | undefined) {
    if (!user?.userId) {
      throw new UnauthorizedException('Please sign in to resend your verification email.');
    }
    return this.authService.sendVerificationEmail(user);
  }

  /** @deprecated Use POST send-verification-email */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(CsrfGuard)
  @Post('resend-verification')
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.authService.resendVerification(user);
  }
}
