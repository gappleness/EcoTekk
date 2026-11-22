cat > .gitignore << 'EOF'
# OS / editor junk
.DS_Store
Thumbs.db
*.swp
*~
.idea/
.vscode/
*.log

# Local / secret configs
.env
.env.*
*.local
firebase-service-account.json
serviceAccountKey.json
*credentials*

# Build leftovers
node_modules/
dist/
.cache/
build/
EOF
