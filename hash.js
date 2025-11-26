const bcrypt = require('bcryptjs');

// Get password from command line
const password = process.argv[2];

if (!password) {
    console.log('Usage: node hash.js <password>');
    console.log('Example: node hash.js password123');
    process.exit(1);
}

// Hash the password
bcrypt.hash(password, 12)
    .then(hash => {
        console.log('\n🔐 HASH GENERATED:');
        console.log('Password:', password);
        console.log('Hash:    ', hash);
        console.log('\n📋 Use this hash in your SQL:');
        console.log(`UPDATE admin_users SET password = '${hash}' WHERE email = 'superadmin@classiccuts.com';`);
    })
    .catch(err => {
        console.error('Error:', err);
    });