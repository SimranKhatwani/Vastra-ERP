const asyncHandler = require('../helpers/asyncHandler');
const ApiResponse = require('../helpers/ApiResponse');
const CustomerService = require('../services/customer.service');

class CustomerController {
  static createCustomer = asyncHandler(async (req, res) => {
    const customer = await CustomerService.createCustomer(req.body, req.tenantId);
    return res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully.'));
  });

  static getCustomers = asyncHandler(async (req, res) => {
    const { customers, pagination } = await CustomerService.getCustomers(req.query, req.tenantId);
    return res.status(200).json(new ApiResponse(200, customers, 'Customers list retrieved.', pagination));
  });

  static getCustomerById = asyncHandler(async (req, res) => {
    const details = await CustomerService.getCustomerById(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, details, 'Customer details fetched.'));
  });

  static getPurchaseHistory = asyncHandler(async (req, res) => {
    const history = await CustomerService.getCustomerPurchaseHistory(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, history, 'Customer purchase history retrieved.'));
  });

  static updateCustomer = asyncHandler(async (req, res) => {
    const customer = await CustomerService.updateCustomer(req.params.id, req.body, req.tenantId);
    return res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully.'));
  });

  static deleteCustomer = asyncHandler(async (req, res) => {
    await CustomerService.deleteCustomer(req.params.id, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, null, 'Customer deleted successfully.'));
  });

  static restoreCustomer = asyncHandler(async (req, res) => {
    const customer = await CustomerService.restoreCustomer(req.params.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, customer, 'Customer restored successfully.'));
  });

  static bulkDeleteCustomers = asyncHandler(async (req, res) => {
    const result = await CustomerService.bulkDeleteCustomers(req.body.customerIds, req.user.id, req.tenantId);
    return res.status(200).json(new ApiResponse(200, result, 'Bulk delete customers completed.'));
  });

  static exportCustomers = asyncHandler(async (req, res) => {
    const exportResult = await CustomerService.exportCustomers(req.query, req.tenantId, req.query.format || 'csv');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      return res.send(exportResult.content);
    }
    return res.status(200).json(new ApiResponse(200, exportResult.content, 'Customers exported successfully.'));
  });
}

module.exports = CustomerController;
