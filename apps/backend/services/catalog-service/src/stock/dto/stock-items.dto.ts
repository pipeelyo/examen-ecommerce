import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class StockItemDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class StockItemsDto {
  @ApiProperty({ type: [StockItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  items!: StockItemDto[];
}
