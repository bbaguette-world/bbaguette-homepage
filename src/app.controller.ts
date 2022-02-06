import { Controller, Get, Render } from '@nestjs/common';
@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return '';
  }

  @Get('nft')
  @Render('nft')
  nft() {
    return '';
  }

  @Get('game')
  @Render('game')
  game() {
    return '';
  }
}
