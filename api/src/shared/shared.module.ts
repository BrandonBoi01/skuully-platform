import { Module } from "@nestjs/common";
import { SmsService } from "./sms/sms.service";

@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SharedModule {}