# Database Setup Instructions for Railway PostgreSQL

## Steps to Set Up the Database

1. **Access Railway PostgreSQL**
   - Go to your Railway project dashboard
   - Click on the PostgreSQL service
   - Click on the "Connect" tab
   - You'll see connection details and a "Connect" button

2. **Option 1: Use Railway's Query Interface**
   - In the PostgreSQL service, go to the "Data" tab
   - Click "New Query"
   - Copy and paste the contents of `schema.sql`
   - Click "Run Query"

3. **Option 2: Use psql Command Line**
   ```bash
   # Copy the DATABASE_URL from Railway
   # It will look like: postgresql://postgres:password@host:port/railway
   
   # Run the schema file
   psql "YOUR_DATABASE_URL" < schema.sql
   ```

4. **Option 3: Use TablePlus or pgAdmin**
   - Download TablePlus (free) or pgAdmin
   - Create new connection using Railway's connection details
   - Open and run the `schema.sql` file

## Verify Setup

After running the schema, verify tables were created:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show:
-- users
-- documents  
-- chat_sessions
-- upload_tracking
```

## Environment Variable

Make sure your Railway backend service has the DATABASE_URL environment variable set. Railway should automatically inject this when you link the PostgreSQL service to your backend service.

## Testing the Connection

The backend will automatically detect and use the database if DATABASE_URL is present. Check the logs:

```
🗄️  Database module loaded
```

If you see this message, the database connection is working!