import type { CheckoutResponseDto } from './dto.js';
import { goldenPreviewWelcome } from './golden.js';

const parsed: CheckoutResponseDto = goldenPreviewWelcome;

if (parsed.finalTotal !== 569.29) {
  throw new Error('golden fixture diverged from CONTRACT');
}
