import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const role = request.headers["x-user-role"];
    if (role !== "ADMIN") {
      throw new ForbiddenException("Se requiere rol ADMIN");
    }
    return true;
  }
}
