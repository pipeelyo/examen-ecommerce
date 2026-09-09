import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from "class-validator";

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
}
