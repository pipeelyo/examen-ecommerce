import { Type } from "class-transformer";
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from "class-validator";

export class CartItemDto {
  @IsString()
  @MinLength(1)
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CheckoutRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;

  // Identifica al cliente que hace el checkout (email de sesion demo o de
  // Google) para que order-service pueda impedir que el mismo cupon se
  // canjee mas de una vez. No es el guestInfo de HU5 (invitado sin sesion):
  // este va siempre que haya alguna sesion activa, con o sin cupon.
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
