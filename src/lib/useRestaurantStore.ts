import { useState, useEffect } from "react";
import { RestaurantStore } from "./RestaurantStore";

export function useRestaurantStore(tableNumber?: string | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = RestaurantStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const activeTableOrder = tableNumber
    ? RestaurantStore.getActiveOrderByTable(tableNumber)
    : undefined;

  const currentTableSession = tableNumber
    ? RestaurantStore.getTableSession(tableNumber)
    : undefined;

  return {
    orders: RestaurantStore.getAllOrders(),
    tables: RestaurantStore.getAllTables(),
    activeServiceRequests: RestaurantStore.getActiveServiceRequests(),
    allServiceRequests: RestaurantStore.getAllServiceRequests(),
    metrics: RestaurantStore.getLiveMetrics(),
    activeTableOrder,
    currentTableSession,
    // Actions
    createOrder: RestaurantStore.createOrder.bind(RestaurantStore),
    updateOrderStatus: RestaurantStore.updateOrderStatus.bind(RestaurantStore),
    updateItemStationStatus: RestaurantStore.updateItemStationStatus.bind(RestaurantStore),
    callWaiter: RestaurantStore.callWaiter.bind(RestaurantStore),
    acknowledgeServiceRequest: RestaurantStore.acknowledgeServiceRequest.bind(RestaurantStore),
    resolveServiceRequest: RestaurantStore.resolveServiceRequest.bind(RestaurantStore),
    recordPayment: RestaurantStore.recordPayment.bind(RestaurantStore),
    submitReview: RestaurantStore.submitReview.bind(RestaurantStore),
    updateTableStatus: RestaurantStore.updateTableStatus.bind(RestaurantStore),
  };
}
