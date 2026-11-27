import { useState, useEffect } from "react";
import { RestaurantStore } from "./RestaurantStore";

export function useRestaurantStore(tableNumber?: string | null) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = RestaurantStore.subscribe(() => {
      setTick((t) => t + 1);
    });

    // Auto-ping browsing when customer loads table
    if (tableNumber) {
      RestaurantStore.pingBrowsing(tableNumber);
    }

    return unsubscribe;
  }, [tableNumber]);

  const activeTableOrder = tableNumber
    ? RestaurantStore.getActiveOrderByTable(tableNumber)
    : undefined;

  const currentTableSession = tableNumber
    ? RestaurantStore.getTableSession(tableNumber)
    : undefined;

  return {
    orders: RestaurantStore.getAllOrders(),
    tables: RestaurantStore.getAllTables(),
    waiters: RestaurantStore.getAllWaiters(),
    metrics: RestaurantStore.getLiveMetrics(),
    activeTableOrder,
    currentTableSession,
    // Actions
    pingBrowsing: RestaurantStore.pingBrowsing.bind(RestaurantStore),
    createOrder: RestaurantStore.createOrder.bind(RestaurantStore),
    claimTable: RestaurantStore.claimTable.bind(RestaurantStore),
    transferTable: RestaurantStore.transferTable.bind(RestaurantStore),
    verifyOrderOtp: RestaurantStore.verifyOrderOtp.bind(RestaurantStore),
    waiterDirectVerify: RestaurantStore.waiterDirectVerify.bind(RestaurantStore),
    resetTable: RestaurantStore.resetTable.bind(RestaurantStore),
    updateOrderStatus: RestaurantStore.updateOrderStatus.bind(RestaurantStore),
    updateItemStationStatus: RestaurantStore.updateItemStationStatus.bind(RestaurantStore),
    recordPayment: RestaurantStore.recordPayment.bind(RestaurantStore),
    submitReview: RestaurantStore.submitReview.bind(RestaurantStore),
    updateTableStatus: RestaurantStore.updateTableStatus.bind(RestaurantStore),
  };
}
