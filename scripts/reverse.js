const { execSync } = require('child_process');

try {
  const output = execSync('adb devices').toString();
  const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Skip the first line: "List of devices attached"
  const devices = lines
    .slice(1)
    .map(line => line.split(/\s+/))
    .filter(parts => parts.length >= 2 && parts[1] === 'device')
    .map(parts => parts[0]);

  if (devices.length === 0) {
    console.log('⚠️ No connected Android devices or emulators found.');
    process.exit(0);
  }

  console.log(`Found ${devices.length} device(s): ${devices.join(', ')}`);

  for (const device of devices) {
    try {
      execSync(`adb -s ${device} reverse tcp:5001 tcp:5001`);
      console.log(`✅ Port 5001 reversed successfully for [${device}]`);
    } catch (err) {
      console.error(`❌ Failed to reverse port 5001 for [${device}]:`, err.message);
    }
  }
} catch (error) {
  console.error('❌ Error executing adb devices:', error.message);
  process.exit(1);
}
