import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

/**
 * Sustituto pragmatico de nivel MVP, igual que AdminGuard: el SDD documenta
 * verificacion real de JWT de Supabase (§08), pero ningun servicio de este
 * repo emite/valida esos tokens todavia. El CONTRACT.md del front solo exige
 * que el header exista y no venga vacio (token demo literal "demo").
 */
@Injectable()
export class BearerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = request.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Falta token Bearer" });
    }
    return true;
  }
}
