import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CalculateLineDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: "Tecnologia" })
  @IsString()
  category!: string;

  @ApiProperty({ example: 70000, description: "Centavos" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalAmount!: number;

  @ApiPropertyOptional({ description: "Centavos; default = originalAmount" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  remainingAmount?: number;
}

export class ResolvedCouponDto {
  @ApiProperty({ enum: ["GLOBAL", "CATEGORY"] })
  @IsIn(["GLOBAL", "CATEGORY"])
  scope!: "GLOBAL" | "CATEGORY";

  @ApiPropertyOptional({ example: "Tecnologia" })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  discountPercent!: number;
}

export class CalculateDiscountsDto {
  @ApiPropertyOptional({ example: 78000, description: "Subtotal original en centavos" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalSubtotal?: number;

  @ApiProperty({ type: [CalculateLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateLineDto)
  lines!: CalculateLineDto[];

  @ApiPropertyOptional({ type: ResolvedCouponDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResolvedCouponDto)
  resolvedCoupon?: ResolvedCouponDto;
}
