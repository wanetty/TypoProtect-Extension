.PHONY: zip

all: chrome firefox

chrome:
	cp manifest_chrome/manifest.json manifest.json
	zip -r typoProtect_chrome.zip . -x "*.git*" "static/*" "*.md" ".DS_Store" "Makefile" "manifest_chrome*" "manifest_firefox*"
	rm manifest.json

firefox:
	cp manifest_firefox/manifest.json manifest.json
	zip -r typoProtect_firefox.zip . -x "*.git*" "static/*" "*.md" ".DS_Store" "Makefile" "manifest_chrome/*" "manifest_firefox/*"
	rm manifest.json
clean:
	rm -rf typoProtect*.zip
