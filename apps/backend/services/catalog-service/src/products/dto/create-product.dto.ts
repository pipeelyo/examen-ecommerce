import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "LAPTOP-14" })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ example: "Laptop" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 700, description: "Precio unitario en dólares" })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
