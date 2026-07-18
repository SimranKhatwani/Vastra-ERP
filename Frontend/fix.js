const fs = require('fs');
let content = fs.readFileSync('src/components/CommissionView.jsx', 'utf8');

const startMarker = '{/* 4. WORKER COMMISSION */}';
const endMarker = '{/* 4. MARKETPLACE & PARTNER SETTLEMENT */}'; // Wait, let me check the exact end marker.

const startIndex = content.indexOf(startMarker);
let endIndex = content.indexOf(endMarker);

if (endIndex === -1) {
    endIndex = content.indexOf('{/* 4. MARKETPLACE');
    if (endIndex === -1) endIndex = content.indexOf('{/* 5. MARKETPLACE');
}

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = startMarker + '\n      {activeTab === "worker" && (\n        <StaffCommissionPanel role="Worker" onAddNotification={onAddNotification} />\n      )}\n\n      ';
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/components/CommissionView.jsx', content);
    console.log('Fixed CommissionView.jsx');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
