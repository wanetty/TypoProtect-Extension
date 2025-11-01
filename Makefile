.PHONY: all chrome firefox clean help

# Build both Chrome and Firefox packages
all: clean chrome firefox
	@echo "✓ Build complete! Generated:"
	@echo "  - typoProtect_chrome_v2.0.0.zip (for Chrome Web Store)"
	@echo "  - typoProtect_firefox_v2.0.0.zip (for Firefox Add-ons)"

# Build Chrome extension package
chrome:
	@echo "Building Chrome extension..."
	@cp manifest_chrome/manifest.json manifest.json
	@zip -q -r typoProtect_chrome_v2.0.0.zip . \
		-x "*.git*" "static/*" "*.md" ".DS_Store" "Makefile" \
		"manifest_chrome/*" "manifest_firefox/*" "*.zip"
	@rm manifest.json
	@echo "✓ Chrome package created: typoProtect_chrome_v2.0.0.zip"

# Build Firefox extension package
firefox:
	@echo "Building Firefox extension..."
	@cp manifest_firefox/manifest.json manifest.json
	@zip -q -r typoProtect_firefox_v2.0.0.zip . \
		-x "*.git*" "static/*" "*.md" ".DS_Store" "Makefile" \
		"manifest_chrome/*" "manifest_firefox/*" "*.zip"
	@rm manifest.json
	@echo "✓ Firefox package created: typoProtect_firefox_v2.0.0.zip"

# Clean generated packages
clean:
	@rm -f typoProtect*.zip
	@rm -f manifest.json
	@echo "✓ Cleaned build artifacts"

# Show help
help:
	@echo "TypoProtect Extension v2.0.0 - Build Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make all       - Build both Chrome and Firefox packages"
	@echo "  make chrome    - Build only Chrome package"
	@echo "  make firefox   - Build only Firefox package"
	@echo "  make clean     - Remove generated .zip files"
	@echo "  make help      - Show this help message"
	@echo ""
	@echo "Output:"
	@echo "  - typoProtect_chrome_v2.0.0.zip"
	@echo "  - typoProtect_firefox_v2.0.0.zip"
