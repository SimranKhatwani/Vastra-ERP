const express = require('express');
const { ALL_PERMISSIONS, PERMISSIONS } = require('../constants/permissions');
const ApiResponse = require('../helpers/ApiResponse');

const router = express.Router();

router.get('/', (req, res) => {
  return res.status(200).json(new ApiResponse(200, {
    permissions: ALL_PERMISSIONS,
    permissionMap: PERMISSIONS
  }, 'Permissions matrix retrieved successfully.'));
});

module.exports = router;
