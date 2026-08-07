/**
 * Reusable Base Mongoose Schema Plugin for Vastra ERP Multi-tenant Models
 */
const mongoose = require('mongoose');

const baseSchemaPlugin = (schema, options = {}) => {
  const isTenantRequired = options.tenantRequired !== false;

  const baseFields = {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      default: 'ACTIVE',
      index: true
    }
  };

  if (isTenantRequired) {
    baseFields.tenantId = {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    };
  }

  schema.add(baseFields);

  // Set timestamps option if not explicitly disabled
  if (options.timestamps !== false) {
    schema.set('timestamps', true);
  }

  // Pre-find hook to filter out soft-deleted items unless explicitly queried
  const applySoftDeleteFilter = function (next) {
    if (this.getFilter().includeDeleted !== true) {
      this.where({ isDeleted: false });
    }
    delete this.getFilter().includeDeleted;
    next();
  };

  schema.pre('find', applySoftDeleteFilter);
  schema.pre('findOne', applySoftDeleteFilter);
  schema.pre('findOneAndUpdate', applySoftDeleteFilter);
  schema.pre('countDocuments', applySoftDeleteFilter);

  // Instance method for soft delete
  schema.methods.softDelete = async function (userId = null) {
    this.isDeleted = true;
    this.deletedBy = userId;
    this.status = 'INACTIVE';
    return this.save();
  };
};

module.exports = baseSchemaPlugin;
