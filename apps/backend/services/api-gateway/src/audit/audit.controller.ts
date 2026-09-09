import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../common/admin.guard";
import { queryAuditEvents } from "./audit-events.repository";
import { parseLimit, toAuditEventDto } from "./audit.mapper";

@Controller("admin/audit")
@UseGuards(AdminGuard)
export class AuditController {
  @Get()
  async list(@Query("entity") entity?: string, @Query("limit") limit?: string) {
    const rows = await queryAuditEvents(entity, parseLimit(limit, 100));
    return rows.map(toAuditEventDto);
  }
}
