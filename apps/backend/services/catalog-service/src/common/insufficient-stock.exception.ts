import { HttpException, HttpStatus } from "@nestjs/common";

export class InsufficientStockException extends HttpException {
  constructor(productId: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: "Stock insuficiente",
        productId,
      },
      HttpStatus.CONFLICT,
    );
  }
}
