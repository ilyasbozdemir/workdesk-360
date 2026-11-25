import { describe, expect, it, vi } from "vitest";
import { InProcessEventBus } from "../../src/application/events/InProcessEventBus";
import { CollectingEventPublisher } from "../../src/application/events/CollectingEventPublisher";
import { DomainEvent } from "../../src/domain/DomainEvent";

class OrderCreatedEvent extends DomainEvent {
    constructor(dosyaId: number, readonly orderNo: string) {
        super("OrderCreated", dosyaId, "2026-11-22T12:00:00Z");
    }
}

class PaymentCompletedEvent extends DomainEvent {
    constructor(dosyaId: number, readonly amount: number) {
        super("PaymentCompleted", dosyaId, "2026-11-22T12:05:00Z");
    }
}

describe("Application Events: InProcessEventBus & CollectingEventPublisher", () => {
    describe("InProcessEventBus", () => {
        it(".on() ile sınıf tabanlı olayları dinler ve çalıştırır", async () => {
            const bus = new InProcessEventBus();
            const handledEvents: OrderCreatedEvent[] = [];

            bus.on(OrderCreatedEvent, "test-handler", (e) => {
                handledEvents.push(e);
            });

            const ev1 = new OrderCreatedEvent(1, "ORD-001");
            const ev2 = new PaymentCompletedEvent(1, 500);

            await bus.publish([ev1, ev2]);

            expect(handledEvents).toHaveLength(1);
            expect(handledEvents[0].orderNo).toBe("ORD-001");
        });

        it(".subscribe() ile olay adına göre dinler ve unsubscribe fonksiyonunu destekler", async () => {
            const bus = new InProcessEventBus();
            const calls: string[] = [];

            const unsubscribe = bus.subscribe("PaymentCompleted", (e: any) => {
                calls.push(`Amount: ${e.amount}`);
            });

            await bus.publish(new PaymentCompletedEvent(1, 750));
            expect(calls).toEqual(["Amount: 750"]);

            // Abonelikten çık
            unsubscribe();

            await bus.publish(new PaymentCompletedEvent(1, 1000));
            // Değer değişmemeli
            expect(calls).toEqual(["Amount: 750"]);
        });

        it("handler hata fırlattığında onFailure çağrılır ve diğer olay akışı kesilmez", async () => {
            const failures: any[] = [];
            const bus = new InProcessEventBus((f) => {
                failures.push(f);
            });

            bus.on(OrderCreatedEvent, "failing-handler", () => {
                throw new Error("Handler hatası");
            });

            let secondHandlerCalled = false;
            bus.on(OrderCreatedEvent, "working-handler", () => {
                secondHandlerCalled = true;
            });

            const event = new OrderCreatedEvent(2, "ORD-ERR");
            await bus.publish(event);

            expect(failures).toHaveLength(1);
            expect(failures[0].handler).toBe("failing-handler");
            expect(failures[0].error.message).toBe("Handler hatası");
            expect(secondHandlerCalled).toBe(true);
        });

        it("clear() tüm kayıtlı dinleyicileri temizler", async () => {
            const bus = new InProcessEventBus();
            let count = 0;

            bus.on(OrderCreatedEvent, "h1", () => {
                count++;
            });
            bus.subscribe("OrderCreated", () => {
                count++;
            });

            bus.clear();

            await bus.publish(new OrderCreatedEvent(1, "ORD-CLEAR"));
            expect(count).toBe(0);
        });
    });

    describe("CollectingEventPublisher", () => {
        it("olayları bellekte toplar ve collectedEvents üzerinden sunar", async () => {
            const collector = new CollectingEventPublisher();
            const ev1 = new OrderCreatedEvent(10, "ORD-10");
            const ev2 = new PaymentCompletedEvent(10, 100);

            await collector.publish(ev1);
            await collector.publishAll([ev2]);

            expect(collector.collectedEvents).toHaveLength(2);
            expect(collector.collectedEvents[0]).toBe(ev1);
            expect(collector.collectedEvents[1]).toBe(ev2);
        });

        it("flush() innerPublisher'a olayları aktarır ve kendi kuyruğunu boşaltır", async () => {
            const bus = new InProcessEventBus();
            const received: DomainEvent[] = [];
            bus.subscribe("OrderCreated", (e) => {
                received.push(e);
            });

            const collector = new CollectingEventPublisher(bus);
            const ev = new OrderCreatedEvent(1, "ORD-FLUSH");

            await collector.publish(ev);
            expect(collector.collectedEvents).toHaveLength(1);

            await collector.flush();
            expect(collector.collectedEvents).toHaveLength(0);
            expect(received).toHaveLength(2); // 1. publish sırasında anında iletildi, 2. flush ile toplu iletildi
        });

        it("clear() toplanan olayları siler", async () => {
            const collector = new CollectingEventPublisher();
            await collector.publish(new OrderCreatedEvent(1, "ORD-X"));
            expect(collector.collectedEvents).toHaveLength(1);

            collector.clear();
            expect(collector.collectedEvents).toHaveLength(0);
        });
    });
});
