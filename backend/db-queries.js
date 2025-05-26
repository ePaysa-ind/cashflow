const pool = require('./db');

// User Management
const userQueries = {
  // Create or update user from Firebase auth
  upsertUser: async (userData) => {
    const query = `
      INSERT INTO users (id, email, full_name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [userData.uid, userData.email, userData.displayName || ''];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get user by Firebase UID
  getUser: async (uid) => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [uid]);
    return result.rows[0];
  },

  // Update user profile
  updateProfile: async (uid, profileData) => {
    const query = `
      UPDATE users SET
        full_name = $2,
        company_name = $3,
        phone = $4,
        industry = $5,
        role = $6,
        zip = $7,
        revenue = $8,
        employees = $9,
        fiscal_year = $10,
        profile_completion = $11,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const values = [
      uid,
      profileData.fullName,
      profileData.company,
      profileData.phone,
      profileData.industry,
      profileData.role,
      profileData.zip,
      profileData.revenue,
      profileData.employees,
      profileData.fiscalYear,
      profileData.completionPercentage || 0
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update upload count
  updateUploadCount: async (uid, increment = 1) => {
    const query = `
      UPDATE users SET
        upload_count = upload_count + $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING upload_count;
    `;
    const result = await pool.query(query, [uid, increment]);
    return result.rows[0];
  },

  // Reset monthly uploads
  resetMonthlyUploads: async (uid) => {
    const query = `
      UPDATE users SET
        upload_count = 0,
        upload_reset_date = NOW(),
        updated_at = NOW()
      WHERE id = $1;
    `;
    await pool.query(query, [uid]);
  }
};

// Document Management
const documentQueries = {
  // Save document analysis
  saveDocument: async (uid, documentData) => {
    const query = `
      INSERT INTO documents (
        user_id, file_name, file_size, file_count, 
        file_hash, analysis_data, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [
      uid,
      documentData.fileName,
      documentData.size,
      documentData.fileCount || 1,
      documentData.hash,
      JSON.stringify(documentData.analysis)
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get user's documents
  getDocuments: async (uid, limit = 100) => {
    const query = `
      SELECT * FROM documents 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2;
    `;
    const result = await pool.query(query, [uid, limit]);
    return result.rows.map(row => ({
      ...row,
      analysis_data: typeof row.analysis_data === 'string' 
        ? JSON.parse(row.analysis_data) 
        : row.analysis_data
    }));
  },

  // Get document by ID
  getDocument: async (uid, documentId) => {
    const query = `
      SELECT * FROM documents 
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await pool.query(query, [documentId, uid]);
    if (result.rows.length === 0) return null;
    
    const doc = result.rows[0];
    return {
      ...doc,
      analysis_data: typeof doc.analysis_data === 'string' 
        ? JSON.parse(doc.analysis_data) 
        : doc.analysis_data
    };
  },

  // Delete document
  deleteDocument: async (uid, documentId) => {
    const query = `
      DELETE FROM documents 
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const result = await pool.query(query, [documentId, uid]);
    return result.rowCount > 0;
  },

  // Check if document already analyzed (by hash)
  checkDocumentHash: async (uid, hash) => {
    const query = `
      SELECT id FROM documents 
      WHERE user_id = $1 AND file_hash = $2
      LIMIT 1;
    `;
    const result = await pool.query(query, [uid, hash]);
    return result.rows.length > 0;
  }
};

// Chat Management
const chatQueries = {
  // Save chat session
  saveChat: async (uid, chatData) => {
    const query = `
      INSERT INTO chat_sessions (
        user_id, document_id, messages, created_at, updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const values = [
      uid,
      chatData.documentId,
      JSON.stringify(chatData.messages)
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update chat session
  updateChat: async (chatId, messages) => {
    const query = `
      UPDATE chat_sessions SET
        messages = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [chatId, JSON.stringify(messages)]);
    return result.rows[0];
  },

  // Get user's chat sessions
  getChats: async (uid, limit = 50) => {
    const query = `
      SELECT cs.*, d.file_name 
      FROM chat_sessions cs
      LEFT JOIN documents d ON cs.document_id = d.id
      WHERE cs.user_id = $1 
      ORDER BY cs.updated_at DESC 
      LIMIT $2;
    `;
    const result = await pool.query(query, [uid, limit]);
    return result.rows.map(row => ({
      ...row,
      messages: typeof row.messages === 'string' 
        ? JSON.parse(row.messages) 
        : row.messages
    }));
  }
};

// Upload Tracking
const uploadQueries = {
  // Track upload
  trackUpload: async (uid, fileCount, fileSize) => {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    const query = `
      INSERT INTO upload_tracking (
        user_id, file_count, file_size, month_year, upload_date
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const values = [uid, fileCount, fileSize, monthYear];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get monthly upload count
  getMonthlyUploads: async (uid) => {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    const query = `
      SELECT COUNT(*) as upload_count, 
             COALESCE(SUM(file_count), 0) as total_files
      FROM upload_tracking 
      WHERE user_id = $1 AND month_year = $2;
    `;
    const result = await pool.query(query, [uid, monthYear]);
    return {
      uploadCount: parseInt(result.rows[0].upload_count),
      totalFiles: parseInt(result.rows[0].total_files)
    };
  }
};

module.exports = {
  userQueries,
  documentQueries,
  chatQueries,
  uploadQueries
};