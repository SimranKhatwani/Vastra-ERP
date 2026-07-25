const User = require('../models/userModel');
const Employee = require('../models/employeeModel');

/**
 * Universal Employee Resolver
 * 
 * Resolves JWT User -> User -> Employee -> Role -> Permissions -> Branch -> Tenant -> employeeId (Employee._id).
 * Guarantees every API operates strictly on Employee._id ObjectId.
 */
class EmployeeResolver {
  static async resolve(reqUser) {
    if (!reqUser) {
      throw new Error('EmployeeResolver: reqUser is required');
    }

    const userId = reqUser._id || reqUser.id;
    const tenantId = reqUser.tenantId;

    let user = await User.findById(userId).lean();
    if (!user) {
      user = reqUser;
    }

    let emp = null;

    // 1. Try resolving Employee directly by user.employeeId ObjectId
    if (user.employeeId) {
      emp = await Employee.findOne({ _id: user.employeeId, tenantId }).lean();
    }

    // 2. Try resolving Employee by emp.userId ObjectId
    if (!emp && userId) {
      emp = await Employee.findOne({ userId, tenantId }).lean();
    }

    // 3. Auto-heal: If Employee exists but User.employeeId is missing, establish bi-directional link
    if (emp && user && (!user.employeeId || String(user.employeeId) !== String(emp._id))) {
      await User.updateOne({ _id: user._id }, { $set: { employeeId: emp._id } });
      user.employeeId = emp._id;
    }

    // 4. Auto-heal: If User exists but Employee is missing (e.g. Admin or newly seeded account), create Employee document
    if (!emp && user) {
      const newEmp = await Employee.create({
        tenantId: user.tenantId,
        userId: user._id,
        name: user.name,
        email: user.email ? user.email.toLowerCase() : `${user.name.toLowerCase().replace(/\s+/g, '')}@garmentflow.com`,
        phone: user.phone || '9999999999',
        role: user.role || 'Salesperson',
        salary: user.salary || 25000,
        shift: 'Full-Day',
        commissionRate: user.commissionRate || 1.5,
        monthlySales: 0,
        totalInvoices: 0,
        commissionEarned: 0
      });
      emp = newEmp.toObject();

      await User.updateOne({ _id: user._id }, { $set: { employeeId: emp._id } });
      user.employeeId = emp._id;
    }

    return {
      employeeId: emp._id,               // Primary MongoDB ObjectId for all business queries
      userId: user._id,                  // User ObjectId
      tenantId: user.tenantId,           // Tenant ObjectId
      branchId: emp.branchId || user.branchId || null,
      role: emp.role || user.role,
      name: emp.name || user.name,
      email: emp.email || user.email,
      phone: emp.phone || user.phone,
      salary: emp.salary || 0,
      shift: emp.shift || 'Full-Day',
      commissionRate: emp.commissionRate || 1.5,
      employeeRecord: emp,
      userRecord: user
    };
  }
}

module.exports = EmployeeResolver;
