import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
//从服务层调用方法,controller调用服务层的方法
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('aaaa')
  @Redirect('https://www.baidu.com', 301)
  getMetadata(): string {
    return this.appService.geta();
  }
}
