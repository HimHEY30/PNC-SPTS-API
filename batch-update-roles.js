const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const collectionPath = path.join(__dirname, 'postman', 'collections', 'PNC-SPTS-API');

// Role access mapping
const roleAccessMap = {
  'Auth': {
    description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ✅ | STUDENT ✅',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
  },
  'Users': {
    default: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ❌ | STUDENT ❌',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    'Delete User': {
      description: '**Role Access:** ADMIN ❌ | SUPER_ADMIN ✅ | TUTOR ❌ | STUDENT ❌',
      roles: ['SUPER_ADMIN']
    },
    'Get My Profile': {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ✅ | STUDENT ✅',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
    }
  },
  'Roles & Permissions': {
    description: '**Role Access:** ADMIN ❌ | SUPER_ADMIN ✅ | TUTOR ❌ | STUDENT ❌',
    roles: ['SUPER_ADMIN']
  },
  'Students': {
    create: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ❌ | STUDENT ❌',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    read: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ⚠️ (assigned only) | STUDENT ⚠️ (own only)',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
    }
  },
  'Follow-Up Cases': {
    create: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ⚠️ (limited) | STUDENT ❌',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR']
    },
    read: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ⚠️ (assigned students) | STUDENT ⚠️ (own only)',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
    },
    update: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ⚠️ (limited) | STUDENT ❌',
      roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR']
    },
    delete: {
      description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ❌ | STUDENT ❌',
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  },
  'User Profile': {
    description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ✅ | STUDENT ✅ (own profile only)',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
  },
  'Health': {
    description: '**Role Access:** ADMIN ✅ | SUPER_ADMIN ✅ | TUTOR ✅ | STUDENT ✅',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TUTOR', 'STUDENT']
  }
};

function getRoleAccess(folderName, requestName, method) {
  const folder = roleAccessMap[folderName];
  
  if (!folder) {
    return null;
  }

  // Handle simple folder mapping
  if (folder.description) {
    return folder.description;
  }

  // Handle Users folder special cases
  if (folderName === 'Users') {
    if (requestName.toLowerCase().includes('delete')) {
      return folder['Delete User'].description;
    }
    if (requestName.toLowerCase().includes('my profile') || requestName.toLowerCase().includes('get my')) {
      return folder['Get My Profile'].description;
    }
    return folder.default.description;
  }

  // Handle Students folder
  if (folderName === 'Students') {
    if (method === 'POST' || requestName.toLowerCase().includes('create')) {
      return folder.create.description;
    }
    if (method === 'PUT' || method === 'PATCH' || requestName.toLowerCase().includes('update')) {
      return folder.create.description;
    }
    if (method === 'DELETE' || requestName.toLowerCase().includes('delete')) {
      return folder.create.description;
    }
    return folder.read.description;
  }

  // Handle Follow-Up Cases folder
  if (folderName === 'Follow-Up Cases') {
    if (method === 'POST' || requestName.toLowerCase().includes('create')) {
      return folder.create.description;
    }
    if (method === 'PUT' || method === 'PATCH' || requestName.toLowerCase().includes('update')) {
      return folder.update.description;
    }
    if (method === 'DELETE' || requestName.toLowerCase().includes('delete')) {
      return folder.delete.description;
    }
    return folder.read.description;
  }

  return null;
}

function findRequestFiles(dir, folderName = '') {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.')) {
      // Recursively search subdirectories
      files.push(...findRequestFiles(fullPath, item));
    } else if (item.endsWith('.request.yaml')) {
      files.push({ path: fullPath, folder: folderName });
    }
  }

  return files;
}

function updateRequestFile(filePath, folderName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);

    if (!data || data.$kind !== 'http-request') {
      console.log(`⚠️  Skipping ${path.basename(filePath)} - not an HTTP request`);
      return false;
    }

    const requestName = data.name || path.basename(filePath, '.request.yaml');
    const method = data.method || 'GET';
    
    const roleAccess = getRoleAccess(folderName, requestName, method);

    if (!roleAccess) {
      console.log(`⚠️  No role mapping for ${folderName}/${requestName}`);
      return false;
    }

    // Update or add description
    const existingDesc = data.description || '';
    
    // Remove existing role access info if present
    const cleanDesc = existingDesc.replace(/\*\*Role Access:\*\*[^\n]*\n?/g, '').trim();
    
    // Add role access at the beginning
    data.description = roleAccess + (cleanDesc ? '\n\n' + cleanDesc : '');

    // Write back to file with proper formatting
    const updatedYaml = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });

    fs.writeFileSync(filePath, updatedYaml, 'utf8');
    console.log(`✅ Updated: ${folderName}/${requestName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting batch update of request files...\n');
  console.log(`Collection path: ${collectionPath}\n`);

  if (!fs.existsSync(collectionPath)) {
    console.error('❌ Collection path does not exist!');
    process.exit(1);
  }

  const requestFiles = findRequestFiles(collectionPath);
  console.log(`Found ${requestFiles.length} request files\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const { path: filePath, folder } of requestFiles) {
    const updated = updateRequestFile(filePath, folder);
    if (updated) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`⚠️  Skipped: ${skipCount}`);
  console.log(`📁 Total files processed: ${requestFiles.length}`);
}

main();
