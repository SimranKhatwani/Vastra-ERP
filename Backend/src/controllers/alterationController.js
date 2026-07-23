const Alteration = require('../models/alterationModel');

// @desc    Create a new alteration record
// @route   POST /api/alterations
// @access  Private
exports.createAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (Array.isArray(req.body)) {
      const recordsToCreate = req.body.map((item, idx) => ({
        ...item,
        tenantId,
        alterationId: item.alterationId || `ALT-${Date.now().toString().slice(-6)}-${idx + 1}`,
        createdBy: item.createdBy || req.user?.name || 'Cashier',
      }));
      const created = await Alteration.insertMany(recordsToCreate);
      return res.status(201).json({ success: true, count: created.length, data: created });
    }

    const count = await Alteration.countDocuments({ tenantId });
    const altCode = `ALT-${Date.now().toString().slice(-4)}${(count + 1).toString().padStart(3, '0')}`;

    const alteration = await Alteration.create({
      ...req.body,
      tenantId,
      alterationId: req.body.alterationId || altCode,
      createdBy: req.body.createdBy || req.user?.name || 'Cashier',
    });

    res.status(201).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all alteration records
// @route   GET /api/alterations
// @access  Private
exports.getAlterations = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};
    const alterations = await Alteration.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, count: alterations.length, data: alterations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single alteration by ID
// @route   GET /api/alterations/:id
// @access  Private
exports.getAlterationById = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };
    const alteration = await Alteration.findOne(filter);

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update alteration status or details
// @route   PATCH /api/alterations/:id
// @access  Private
exports.updateAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };

    const alteration = await Alteration.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete alteration record
// @route   DELETE /api/alterations/:id
// @access  Private
exports.deleteAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };

    const alteration = await Alteration.findOneAndDelete(filter);

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
