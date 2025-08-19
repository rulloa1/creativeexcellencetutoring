const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Building Creative Excellence Tutoring Project...\n');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log('📁 Created dist directory');
}

try {
  // Check if we have downloaded JS files to bundle
  const jsFiles = fs.readdirSync(__dirname).filter(file => 
    file.endsWith('.js.download') || 
    (file.endsWith('.js') && file !== 'index.js' && file !== 'build.js')
  );

  if (jsFiles.length > 0) {
    console.log('📦 Found JavaScript files to process:');
    jsFiles.forEach(file => console.log(`   - ${file}`));

    // Rename .download files to .js for processing
    const processedFiles = [];
    jsFiles.forEach(file => {
      if (file.endsWith('.download')) {
        const newName = file.replace('.download', '');
        const oldPath = path.join(__dirname, file);
        const newPath = path.join(__dirname, `temp_${newName}`);
        fs.copyFileSync(oldPath, newPath);
        processedFiles.push(`temp_${newName}`);
      } else {
        processedFiles.push(file);
      }
    });

    // Try to use esbuild if available
    try {
      console.log('\n🔧 Using esbuild for bundling and minification...');
      
      // Create a simple entry point that imports all JS files
      const entryContent = processedFiles
        .filter(file => !file.includes('jquery') && !file.includes('recaptcha'))
        .map(file => `import './${file}';`)
        .join('\n');
      
      fs.writeFileSync(path.join(__dirname, 'temp_entry.js'), entryContent);

      // Run esbuild
      execSync(`npx esbuild temp_entry.js --bundle --minify --outfile=dist/bundle.min.js --format=iife --global-name=TutoringApp`, {
        stdio: 'inherit',
        cwd: __dirname
      });

      console.log('✅ Bundle created: dist/bundle.min.js');

      // Clean up temp files
      processedFiles.forEach(file => {
        const tempPath = path.join(__dirname, file);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      });
      fs.unlinkSync(path.join(__dirname, 'temp_entry.js'));

    } catch (esbuildError) {
      console.log('⚠️  esbuild not available, copying files directly...');
      
      // Fallback: just copy and rename files
      processedFiles.forEach(file => {
        const sourcePath = path.join(__dirname, file);
        const destPath = path.join(distDir, file.replace('temp_', ''));
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`📄 Copied: ${file} -> dist/${file.replace('temp_', '')}`);
        }
      });

      // Clean up temp files
      processedFiles.forEach(file => {
        const tempPath = path.join(__dirname, file);
        if (fs.existsSync(tempPath) && file.startsWith('temp_')) {
          fs.unlinkSync(tempPath);
        }
      });
    }
  }

  // Copy CSS files
  const cssFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.css'));
  if (cssFiles.length > 0) {
    console.log('\n🎨 Processing CSS files:');
    cssFiles.forEach(file => {
      const sourcePath = path.join(__dirname, file);
      const destPath = path.join(distDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`   - ${file} -> dist/${file}`);
    });
  }

  // Copy HTML files
  const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));
  if (htmlFiles.length > 0) {
    console.log('\n📄 Processing HTML files:');
    htmlFiles.forEach(file => {
      const sourcePath = path.join(__dirname, file);
      const destPath = path.join(distDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`   - ${file} -> dist/${file}`);
    });
  }

  // Copy images
  const imageFiles = fs.readdirSync(__dirname).filter(file => 
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif')
  );
  
  if (imageFiles.length > 0) {
    console.log('\n🖼️  Processing images:');
    const imgDir = path.join(distDir, 'images');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir);
    }
    
    imageFiles.forEach(file => {
      const sourcePath = path.join(__dirname, file);
      const destPath = path.join(imgDir, file);
      fs.copyFileSync(sourcePath, destPath);
    });
    console.log(`   - Copied ${imageFiles.length} images to dist/images/`);
  }

  // Generate build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    files: {
      javascript: jsFiles.length,
      css: cssFiles.length,
      html: htmlFiles.length,
      images: imageFiles.length
    },
    buildVersion: require('./package.json').version
  };

  fs.writeFileSync(
    path.join(distDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );

  console.log('\n✅ Build completed successfully!');
  console.log(`📊 Build info saved to dist/build-info.json`);
  console.log(`🕒 Build time: ${new Date().toLocaleString()}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
