import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class HealthController {
  @Get("health")
  @ApiOperation({ summary: "Liveness/readiness" })
  ok() {
    return { status: "ok", service: "order-service" };
  }
}
