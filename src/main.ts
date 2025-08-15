import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env);
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`🚀 应用启动成功！`);
  console.log(`📍 服务器地址: http://localhost:${port}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ 应用启动失败:', error);
  process.exit(1);
});
