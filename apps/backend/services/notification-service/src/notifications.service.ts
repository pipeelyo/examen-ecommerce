import { Injectable, Logger } from "@nestjs/common";

export interface OrderEventEnvelope {
  eventType: string;
  aggregateId: string;
  payload: unknown;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Punto de entrada desde Redis Pub/Sub: un mensaje mal formado o de un tipo
   * que no nos interesa se descarta sin propagar el error — un consumidor no
   * debe caerse por un evento invalido ni por un fallo al notificar (SDD §09).
   */
  async handleRawEvent(raw: string): Promise<void> {
    let event: OrderEventEnvelope;
    try {
      event = JSON.parse(raw) as OrderEventEnvelope;
    } catch {
      this.logger.warn(`evento invalido, se descarta: ${raw}`);
      return;
    }

    if (event.eventType !== "OrderConfirmed") {
      return;
    }

    try {
      await this.sendConfirmation(event);
    } catch (err) {
      this.logger.error("fallo al enviar confirmacion", err as Error);
    }
  }

  async sendConfirmation(event: OrderEventEnvelope): Promise<void> {
    // MVP: log estructurado — interfaz lista para un proveedor real (email/SMS) en Enterprise
    this.logger.log(
      JSON.stringify({
        msg: "Order confirmed - notification sent (stub)",
        orderId: event.aggregateId,
        payload: event.payload,
      }),
    );
  }
}
