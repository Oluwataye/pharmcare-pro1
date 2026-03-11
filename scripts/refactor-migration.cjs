const fs = require('fs');
const path = require('path');

const migrationsDir = 'supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let modifiedAny = false;

files.forEach(fileName => {
  const filePath = path.join(migrationsDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Make CREATE TABLE idempotent 
  content = content.replace(/CREATE TABLE\s+((?!IF NOT EXISTS\s)[a-zA-Z0-9_\.]+)\s*\(/gi, 'CREATE TABLE IF NOT EXISTS $1 (');

  // 1b. Make CREATE TYPE idempotent (wrap in DO $$ IF NOT EXISTS block)
  content = content.replace(/CREATE TYPE\s+(public\.)?([a-zA-Z0-9_]+)\s+AS ENUM\s+\(([^;]+)\);/gi,
    (match, schema, typeName, values) => {
      if (originalContent.includes(`typname = '${typeName}'`)) return match;
      return `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN\n    CREATE TYPE public.${typeName} AS ENUM (${values});\n  END IF;\nEND\n$$;`;
    }
  );

  // 2-4. Wrap CREATE POLICY are already doing fine with IF NOT EXISTS logic
  // Just in case, ensuring we don't accidentally nest DO blocks (handled by the script checking originalContent)
  const isWrappedPolicy = (policyName, tableName) => originalContent.includes(`policyname = '${policyName}'`);

  // To properly handle multi-line and nested parenthesis like WITH CHECK ( EXISTS ( ... ) )
  // We use a broader regex that captures everything up to the final semicolon.
  
  // A helper function to wrap policies safely
  const wrapPolicy = (match, policyName, tableName, body) => {
      if (isWrappedPolicy(policyName, tableName.replace('public.', ''))) return match;
      const cleanTableName = tableName.replace('public.', '');
      return `DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = '${cleanTableName}' AND policyname = '${policyName}'
  ) THEN 
    CREATE POLICY "${policyName}" \n  ON ${tableName}\n  ${body};
  END IF; 
END
$$;`;
  };

  // 1: basic matching across multiple permutations, stopping at the final semicolon.
  content = content.replace(/CREATE POLICY\s+"([^"]+)"\r?\n\s*ON\s+([a-zA-Z0-9_\.]+)\r?\n([^;]+);/gi, 
    (match, policyName, tableName, body) => wrapPolicy(match, policyName, tableName, body)
  );
  
  // 2: inline matching (e.g. CREATE POLICY ... ON public.table FOR ALL TO service_role USING ...)
  content = content.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_\.]+)\s+FOR\s+([A-Z]+)\s+TO\s+([a-zA-Z0-9_]+)\s+USING\s+\((([^;]|\n)+)\);/gi, 
     (match, policyName, tableName, action, role, body) => wrapPolicy(match, policyName, tableName, body)
  );
  
  // 3: inline matching with WITH CHECK
  content = content.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_\.]+)\s+FOR\s+([A-Z]+)\s+TO\s+([a-zA-Z0-9_]+)\s+USING\s+\((([^;]|\n)+)\)\s+WITH CHECK\s+\((((?!\);\n)[^])+\)\n?);/gi,
     (match, policyName, tableName, action, role, usingBody, checkBody) => wrapPolicy(match, policyName, tableName, `FOR ${action} TO ${role} USING (${usingBody}) WITH CHECK (${checkBody})`)
  );

  // 5. TRULY Robust Trigger Handling
  // We want to replace basic CREATE TRIGGER with a DROP TRIGGER IF EXISTS followed by CREATE TRIGGER
  // Need to be careful not to replace already safe triggers
  
  // Regex to match: CREATE TRIGGER trigger_name [BEFORE|AFTER] [INSERT|UPDATE|DELETE] ON schema.table
  content = content.replace(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE|TRUNCATE)\s+ON\s+([a-zA-Z0-9_\.]+)\s+FOR\s+EACH\s+ROW\s+EXECUTE\s+FUNCTION\s+([a-zA-Z0-9_\.\(\)]+)(;|$)/gim, 
    (match, triggerName, timing, event, tableName, functionCall, endChar) => {
      // If we've already prepended a DROP TRIGGER for this specific trigger name, skip
      if (originalContent.includes(`DROP TRIGGER IF EXISTS ${triggerName}`)) {
         return match;
      }
      return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};
CREATE TRIGGER ${triggerName}
  ${timing} ${event} ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION ${functionCall}${endChar}`;
    }
  );

  // Catch other trigger variants (like the one in the screenshot which spans multiple lines without semi-colon ending strictly captured)
  content = content.replace(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)\r?\n\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE|TRUNCATE)\s+ON\s+([a-zA-Z0-9_\.]+)\r?\n\s+FOR\s+EACH\s+ROW\r?\n\s+EXECUTE\s+FUNCTION\s+([a-zA-Z0-9_\.\(\)]+)/gim, 
    (match, triggerName, timing, event, tableName, functionCall) => {
      if (originalContent.includes(`DROP TRIGGER IF EXISTS ${triggerName}`)) {
         return match;
      }
      return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};
CREATE TRIGGER ${triggerName}
  ${timing} ${event} ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION ${functionCall}`;
    }
  );

  // 6. Make CREATE INDEX idempotent
  content = content.replace(/CREATE INDEX\s+((?!IF NOT EXISTS\s)[a-zA-Z0-9_\.]+)\s+ON/gi, 'CREATE INDEX IF NOT EXISTS $1 ON');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Refactored Triggers/Policies in: ${fileName}`);
    modifiedAny = true;
  }
});

if (modifiedAny) {
    console.log('All migrations updated with robust idempotent Trigger generation.');
} else {
    console.log('No additional modifications needed.');
}
