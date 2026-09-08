import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, NotEquals } from "class-validator";

export class AdjustStockDto {
  @ApiProperty({ example: -2, description: "Incremento (positivo) o decremento (negativo)" })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta!: number;
}
