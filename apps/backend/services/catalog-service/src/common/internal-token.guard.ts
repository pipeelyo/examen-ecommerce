import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const expected = process.env.INTERNAL_SERVICE_TOKEN ?? "dev-internal-token";
    const received = request.headers["x-internal-token"];
    if (received !== expected) {
      throw new UnauthorizedException("X-Internal-Token inválido");
    }
    return true;
  }
}
