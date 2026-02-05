import { Client } from 'ldapts';
import AppError from '../utils/appError.js';

/**
 * LDAP Service for authentication
 * Uses ldapts library for promise-based LDAP operations
 */
class LDAPService {
  /**
   * Get LDAP configuration from environment variables
   * Loaded dynamically to ensure env vars are available
   */
  getConfig() {
    return {
      ldapUrl: process.env.HRPORTAL_LDAP_Server,
      baseDN: process.env.HRPORTAL_LDAP_BaseDN,
      adminUser: process.env.HRPORTAL_LDAP_User,
      adminPassword: process.env.HRPORTAL_LDAP_PW,
    };
  }

  /**
   * Create and return a new LDAP client
   */
  createClient() {
    const { ldapUrl } = this.getConfig();

    if (!ldapUrl) {
      throw new AppError('LDAP server URL is not configured', 500);
    }

    return new Client({
      url: ldapUrl,
      timeout: 5000,
      connectTimeout: 10000,
    });
  }

  /**
   * Search for a user by email in LDAP directory
   * @param {string} email - User's email address
   * @returns {Object|null} - LDAP user entry or null if not found
   */
  async searchUserByEmail(email) {
    const client = this.createClient();
    const { adminUser, adminPassword, baseDN } = this.getConfig();

    try {
      // Bind with admin credentials to search
      await client.bind(adminUser, adminPassword);

      // Extract username from email (e.g., testuser3 from testuser3@lab.local)
      const username = email.split('@')[0];

      // Try multiple search filters to find the user
      // This handles different LDAP configurations
      const filters = [
        `(mail=${email})`, // Search by email
        `(userPrincipalName=${email})`, // Search by UPN
        `(sAMAccountName=${username})`, // Search by username
        `(|(mail=${email})(userPrincipalName=${email})(sAMAccountName=${username}))`, // OR search
      ];

      console.log(`[LDAP] Searching for user: ${email}`);
      console.log(`[LDAP] Base DN: ${baseDN}`);

      // Try each filter until we find the user
      for (const filter of filters) {
        console.log(`[LDAP] Trying filter: ${filter}`);

        const searchOptions = {
          filter,
          scope: 'sub',
          attributes: ['cn', 'mail', 'sAMAccountName', 'displayName', 'distinguishedName', 'userPrincipalName', 'dn'],
        };

        const { searchEntries } = await client.search(baseDN, searchOptions);

        if (searchEntries.length > 0) {
          console.log(`[LDAP] User found with filter: ${filter}`);
          console.log(`[LDAP] User details:`, JSON.stringify(searchEntries[0], null, 2));
          return searchEntries[0];
        }
      }

      console.log('[LDAP] User not found with any filter');
      return null;
    } catch (error) {
      console.error('[LDAP] Search error:', error);
      throw new AppError('Failed to search LDAP directory', 500);
    } finally {
      await client.unbind();
    }
  }

  /**
   * Authenticate a user against LDAP
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Object} - User information from LDAP
   */
  async authenticateUser(email, password) {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // First, search for the user to get their DN
    const userEntry = await this.searchUserByEmail(email);

    if (!userEntry) {
      throw new AppError('User not found in LDAP directory', 404);
    }

    // Get the user's Distinguished Name (DN)
    const userDN = userEntry.dn || userEntry.distinguishedName;

    if (!userDN) {
      throw new AppError('User DN not found', 500);
    }

    // Create a new client for user authentication
    const client = this.createClient();

    try {
      // Try to bind with user's credentials
      await client.bind(userDN, password);

      // If bind succeeds, authentication is successful
      return {
        email: userEntry.mail,
        displayName: userEntry.displayName || userEntry.cn,
        username: userEntry.sAMAccountName,
        dn: userDN,
      };
    } catch (error) {
      console.error('LDAP authentication error:', error);

      // Check if it's an authentication failure
      if (error.message && error.message.includes('InvalidCredentials')) {
        throw new AppError('Invalid LDAP credentials', 401);
      }

      throw new AppError('LDAP authentication failed', 500);
    } finally {
      await client.unbind();
    }
  }

  /**
   * Test LDAP connection
   * @returns {boolean} - true if connection successful
   */
  async testConnection() {
    const client = this.createClient();
    const { adminUser, adminPassword } = this.getConfig();

    try {
      await client.bind(adminUser, adminPassword);
      await client.unbind();
      return true;
    } catch (error) {
      console.error('LDAP connection test failed:', error);
      return false;
    }
  }
}

export default new LDAPService();
