const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('alert(')) {
    console.log('Replacing in', filePath);
    
    // Replace logic:
    // Success alerts
    content = content.replace(/alert\((.*?successfully.*?)\)/gi, 'toast.success($1)');
    content = content.replace(/alert\((.*Matched.*)\)/gi, 'toast.success($1)');
    content = content.replace(/alert\((.*Scanned.*)\)/gi, 'toast.success($1)');
    // Error alerts
    content = content.replace(/alert\(/g, 'toast.error(');
    
    // Add import
    if (!content.includes('useToast')) {
      content = "import { useToast } from '@/components/ToastProvider';\n" + content;
    }
    
    // Add hook call inside component
    const componentMatch = content.match(/export default function \w+\(\) \{/);
    if (componentMatch) {
      if (!content.includes('const toast = useToast();')) {
        content = content.replace(componentMatch[0], componentMatch[0] + '\n  const toast = useToast();');
      }
    } else {
        // Some components might not use `export default function Name() {` format, 
        // fallback to manual insert if missing?
    }
    
    fs.writeFileSync(filePath, content);
  }
});
console.log('Replaced alerts with toasts!');
