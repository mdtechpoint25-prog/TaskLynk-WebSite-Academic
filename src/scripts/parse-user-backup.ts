/**
 * Helper script to parse TSV user backup data
 * Usage: Run this to convert your TSV backup into JSON format for the import API
 */

const tsvData = `your TSV data here`; // Paste your TSV data

function parseTSV(tsv: string) {
  const lines = tsv.trim().split('\n');
  const headers = lines[0].split('\t');
  
  const users = lines.slice(1).map(line => {
    const values = line.split('\t');
    const user: any = {};
    
    headers.forEach((header, index) => {
      user[header] = values[index] || null;
    });
    
    return user;
  });

  return users;
}

// Example usage:
// const users = parseTSV(tsvData);
// console.log(JSON.stringify(users, null, 2));

// To import:
// 1. Paste your TSV data above
// 2. Run: bun run src/scripts/parse-user-backup.ts
// 3. Copy the JSON output
// 4. Make a POST request to /api/admin/import-users with: { "userData": [...] }

export { parseTSV };
