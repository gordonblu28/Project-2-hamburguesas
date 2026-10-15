import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Order } from "@/types/order";

/**
 * Persistence boundary for orders. Swap the implementation for PostgreSQL /
 * Supabase in production (see docs/database.sql for a matching schema).
 */
export interface OrderRepository {
  /** Whether this store is a local development store (orders never reach the restaurant). */
  readonly isDemo: boolean;
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  update(id: string, mutate: (o: Order) => Order): Promise<Order | null>;
  findByPaymentReference(ref: string): Promise<Order | null>;
}

/** In-memory store, used by tests. */
export class MemoryOrderRepository implements OrderRepository {
  readonly isDemo = true;
  protected orders = new Map<string, Order>();
  async create(order: Order) {
    this.orders.set(order.id, structuredClone(order));
    return order;
  }
  async findById(id: string) {
    const o = this.orders.get(id);
    return o ? structuredClone(o) : null;
  }
  async findByIdempotencyKey(key: string) {
    for (const o of this.orders.values()) if (o.idempotencyKey === key) return structuredClone(o);
    return null;
  }
  async findByPaymentReference(ref: string) {
    for (const o of this.orders.values()) if (o.payment.providerReference === ref) return structuredClone(o);
    return null;
  }
  async update(id: string, mutate: (o: Order) => Order) {
    const o = this.orders.get(id);
    if (!o) return null;
    const next = mutate(structuredClone(o));
    this.orders.set(id, next);
    return structuredClone(next);
  }
}

/**
 * Development file store: writes JSON to ./.data/orders.json on the machine
 * running the server. NOT suitable for production or serverless hosting, and
 * NOTHING stored here is transmitted to the restaurant.
 */
class FileOrderRepository extends MemoryOrderRepository {
  private loaded = false;
  private chain: Promise<unknown> = Promise.resolve();
  constructor(private file: string) {
    super();
  }
  private async load() {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const list = JSON.parse(raw) as Order[];
      this.orders = new Map(list.map((o) => [o.id, o]));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    this.loaded = true;
  }
  private async persist() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify([...this.orders.values()], null, 2));
    await fs.rename(tmp, this.file);
  }
  /** Serialise all operations to avoid lost writes. */
  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }
  override create(order: Order) {
    return this.run(async () => {
      await this.load();
      await super.create(order);
      await this.persist();
      return order;
    });
  }
  override findById(id: string) {
    return this.run(async () => (await this.load(), super.findById(id)));
  }
  override findByIdempotencyKey(key: string) {
    return this.run(async () => (await this.load(), super.findByIdempotencyKey(key)));
  }
  override findByPaymentReference(ref: string) {
    return this.run(async () => (await this.load(), super.findByPaymentReference(ref)));
  }
  override update(id: string, mutate: (o: Order) => Order) {
    return this.run(async () => {
      await this.load();
      const r = await super.update(id, mutate);
      if (r) await this.persist();
      return r;
    });
  }
}

const globalStore = globalThis as unknown as { __shOrderRepo?: OrderRepository };

export function getOrderRepository(): OrderRepository {
  if (globalStore.__shOrderRepo) return globalStore.__shOrderRepo;
  const kind = process.env.ORDER_STORE ?? "file";
  let repo: OrderRepository;
  switch (kind) {
    case "file":
      repo = new FileOrderRepository(path.join(process.cwd(), ".data", "orders.json"));
      break;
    case "memory":
      repo = new MemoryOrderRepository();
      break;
    default:
      throw new Error(
        `ORDER_STORE="${kind}" is not implemented. Add a PostgreSQL/Supabase OrderRepository in lib/orders/repository.ts.`,
      );
  }
  globalStore.__shOrderRepo = repo;
  return repo;
}
