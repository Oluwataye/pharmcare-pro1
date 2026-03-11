const fs = require('fs');
const path = require('path');
const migrationsDir = 'supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let count = 0;
files.forEach(fileName => {
  const filePath = path.join(migrationsDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We find patterns like:
  // USING (true)
  // END IF;
  // And replace with:
  // USING (true);
  // END IF;
  
  // Regex matches any non-whitespace, non-semicolon character, followed by whitespace and "END IF;"
  content = content.replace(/([^;\s])(\s+END IF;\s+END\s+\$\$;)/g, '$1;$2');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Addressed missing semicolon in: ${fileName}`);
    count++;
  }
});

console.log(`Successfully fixed semicolons in ${count} files.`);
