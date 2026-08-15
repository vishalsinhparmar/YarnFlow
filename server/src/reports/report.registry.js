import purchaseOrderDefinition from './report.definitions/purchaseOrder.definition.js';
import grnDefinition from './report.definitions/grn.definition.js';
import inventoryLotDefinition from './report.definitions/inventoryLot.definition.js';
import salesOrderDefinition from './report.definitions/salesOrder.definition.js';
import salesChallanDefinition from './report.definitions/salesChallan.definition.js';
import customerDefinition from './report.definitions/customer.definition.js';
import supplierDefinition from './report.definitions/supplier.definition.js';
import productDefinition from './report.definitions/product.definition.js';
import categoryDefinition from './report.definitions/category.definition.js';
import warehouseDefinition from './report.definitions/warehouse.definition.js';
import userDefinition from './report.definitions/user.definition.js';

const definitions = [
  purchaseOrderDefinition,
  grnDefinition,
  inventoryLotDefinition,
  salesOrderDefinition,
  salesChallanDefinition,
  customerDefinition,
  supplierDefinition,
  productDefinition,
  categoryDefinition,
  warehouseDefinition,
  userDefinition
];

const registry = new Map(definitions.map(d => [d.key, d]));

export const getReportDefinition = (key) => registry.get(key) || null;

export const listReportDefinitions = () =>
  definitions.map(d => ({
    key: d.key,
    name: d.name,
    description: d.description,
    category: d.category,
    icon: d.icon,
    defaultFields: d.defaultFields
  }));

export { registry };
export default registry;
