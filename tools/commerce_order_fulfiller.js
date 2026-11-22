// MCP tool: commerce_order_fulfiller (trusted local use only - bound to 127.0.0.1).
import { downloadsForOrder } from '../server/commerce/digital-delivery.js';
import { appendEvent, getOrder } from '../server/commerce/order-ledger.js';
import { withLock } from '../server/commerce/util.js';

const summary = (o) => ({
  orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt, paidAt: o.paidAt || null,
  customerEmail: o.customerEmail, fulfillment: o.fulfillment, tracking: o.tracking || null, pricing: o.pricing,
  reviewReason: o.reviewReason || null,
  lines: o.lines.map(({ sku, title, quantity, kind }) => ({ sku, title, quantity, kind })),
});

export default {
  name: 'commerce_order_fulfiller',
  description: 'Fetch order records, fulfill physical items, or re-issue digital download links.',
  inputSchema: {
    type: 'object',
    properties: {
      orderNumber: { type: 'string' },
      action: { type: 'string', enum: ['get_status', 'mark_shipped', 'mark_picked_up', 'regenerate_download_link'] },
      carrier: { type: 'string' },
      trackingNumber: { type: 'string' },
    },
    required: ['orderNumber', 'action'],
  },
  async handler({ orderNumber, action, carrier, trackingNumber }) {
    const order = await getOrder(orderNumber);
    if (!order) throw new Error(`Order not found: ${orderNumber}`);
    switch (action) {
      case 'get_status': return summary(order);
      case 'mark_shipped':
        if (order.status !== 'paid' || order.fulfillment?.method !== 'physical_ship') throw new Error('Only paid orders with physical_ship fulfillment can be marked shipped');
        await withLock(() => appendEvent(orderNumber, 'shipped', { carrier, trackingNumber }));
        return summary(await getOrder(orderNumber));
      case 'mark_picked_up':
        if (order.status !== 'paid' || order.fulfillment?.method !== 'local_pickup') throw new Error('Only paid local_pickup orders can be marked picked up');
        await withLock(() => appendEvent(orderNumber, 'picked_up'));
        return summary(await getOrder(orderNumber));
      case 'regenerate_download_link': {
        const downloads = downloadsForOrder(order);
        if (!downloads.length) throw new Error('No downloadable items, or order is not paid');
        return { orderNumber, downloads };
      }
      default: throw new Error(`Unknown action: ${action}`);
    }
  },
};
