import 'dotenv/config';
import ldapService from '../services/ldapService.js';

/**
 * Test script for LDAP connection and authentication
 * Usage: node src/scripts/testLdap.js
 */

async function testLdapConnection() {
  console.log('=== LDAP Configuration Test ===\n');

  // Display configuration (without sensitive data)
  console.log('LDAP Configuration:');
  console.log('- Server:', process.env.HRPORTAL_LDAP_Server);
  console.log('- Base DN:', process.env.HRPORTAL_LDAP_BaseDN);
  console.log('- Admin User:', process.env.HRPORTAL_LDAP_User);
  console.log('- Password:', process.env.HRPORTAL_LDAP_PW ? '***configured***' : 'NOT SET');
  console.log();

  // Test connection
  console.log('Testing LDAP connection...');
  try {
    const isConnected = await ldapService.testConnection();

    if (isConnected) {
      console.log('✓ LDAP connection successful!\n');
      return true;
    } else {
      console.log('✗ LDAP connection failed!\n');
      return false;
    }
  } catch (error) {
    console.error('✗ LDAP connection error:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function testLdapAuth(email, password) {
  console.log(`\n=== Testing LDAP Authentication for ${email} ===\n`);

  try {
    const user = await ldapService.authenticateUser(email, password);
    console.log('✓ Authentication successful!');
    console.log('User details:');
    console.log('- Email:', user.email);
    console.log('- Display Name:', user.displayName);
    console.log('- Username:', user.username);
    console.log('- DN:', user.dn);
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    return false;
  }
}

async function testLdapSearch(email) {
  console.log(`\n=== Testing LDAP User Search for ${email} ===\n`);

  try {
    const user = await ldapService.searchUserByEmail(email);

    if (user) {
      console.log('✓ User found!');
      console.log('User details:', JSON.stringify(user, null, 2));
      return true;
    } else {
      console.log('✗ User not found in LDAP directory');
      return false;
    }
  } catch (error) {
    console.error('✗ Search failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.clear();

  // Test connection
  const connectionSuccess = await testLdapConnection();

  if (!connectionSuccess) {
    console.log('\nPlease check your LDAP configuration in .env file');
    process.exit(1);
  }

  // Example: Test search for a user
  // Uncomment and modify with a test email
  // await testLdapSearch('testuser@lab.local');

  // Example: Test authentication
  // Uncomment and modify with test credentials
  // await testLdapAuth('testuser@lab.local', 'password');

  console.log('\n=== Test completed ===');
  console.log('\nTo test authentication, uncomment the testLdapAuth() call');
  console.log('in this script and provide valid credentials.\n');
}

main().catch(console.error);
