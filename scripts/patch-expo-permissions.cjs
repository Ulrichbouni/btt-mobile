const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt');
const source = fs.readFileSync(file, 'utf8');
const before = 'return requestedPermissions.contains(permission)';
const after = 'return requestedPermissions?.contains(permission) == true';
if (source.includes(after)) {
  console.log('Expo permissions SDK 36 patch already applied');
} else {
  if (source.split(before).length !== 2) throw new Error('Unexpected Expo PermissionsService source');
  fs.writeFileSync(file, source.replace(before, after));
  console.log('Expo permissions SDK 36 nullability patch applied');
}
