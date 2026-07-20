const http = require('http');

console.log("Triggering DB migration endpoint...");
http.get('http://localhost:5000/api/products/migrate-codes', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response Status:", res.statusCode);
    console.log("Response Data:", data);
    try {
      const parsed = JSON.parse(data);
      if (parsed.success) {
        console.log("Migration executed successfully by the running API server!");
      } else {
        console.error("Migration failed:", parsed.message);
      }
    } catch (e) {
      console.error("Parsing response failed:", e.message);
    }
  });
}).on('error', (err) => {
  console.error("Connection to local server failed:", err.message);
});
