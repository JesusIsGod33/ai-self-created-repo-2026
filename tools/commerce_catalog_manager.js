// MCP tool: commerce_catalog_manager. Adjust the export shape if your tool-loader.js expects another.
import { deleteProduct, getProduct, listProducts, upsertProduct } from '../server/commerce/catalog-service.js';

export default {
  name: 'commerce_catalog_manager',
  description: 'Query, add, or update products in the catalog JSON store.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['list', 'get', 'upsert', 'delete'] },
      productData: { type: 'object' },
    },
    required: ['action'],
  },
  async handler({ action, productData = {} }) {
    switch (action) {
      case 'list': return { products: await listProducts(productData) };
      case 'get': {
        const p = await getProduct(productData.id || productData.slug);
        if (!p) throw new Error('Product not found');
        return { product: p };
      }
      case 'upsert': return upsertProduct(productData);
      case 'delete': return deleteProduct(productData.id);
      default: throw new Error(`Unknown action: ${action}`);
    }
  },
};
