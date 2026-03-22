import { OrderList } from "./order-list";

export default function OrdersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>
      <OrderList />
    </div>
  );
}
