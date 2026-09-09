import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

/**
 * Sustituto pragmatico de nivel MVP: el SDD documenta verificacion real de
 * JWT de Supabase (§08), pero ningun servicio de este repo emite/valida esos
 * tokens todavia. Mientras tanto, un token de admin compartido — mismo
 * patron que INTERNAL_SERVICE_TOKEN — gatea las rutas /admin/* del gateway.
 * Migrar a JWT real mas adelante solo cambia este guard, no los controllers.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
      throw new InternalServerErrorException("ADMIN_API_TOKEN no configurado");
    }
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const received = request.headers["x-admin-token"];
    if (received !== expected) {
      throw new ForbiddenException("Se requiere token de administrador válido");
    }
    return true;
  }
}
