# Typosquatting Protection Extension

<p align="center"><img width=250 alt="Logo" src="https://github.com/wanetty/TypoProtect-Extension/blob/main/static/logo.png"></p>


Protect yourself from typosquatting attacks with our advanced browser extension. Compatible with all browsers supporting Manifest V3, it ensures you're always on the right track.

## Key Features

- **Safe Browsing**: Automatically verifies URLs to prevent typosquatting and phishing attempts.
- **User-Friendly Interface**: Easy-to-use popup for quick settings and status checks.


## Core Components

The extension consists of three main parts:

- **Background**: The heart of our extension, located at [src/background/background.js](src/background/background.js), constantly monitors and secures your browsing.
- **Popup**: Accessible via the [src/popup](src/popup) directory, the popup window offers control and information at your fingertips.
- **Content Scripts**: The content script is located at [src/content/content.js](src/content/content.js). This script runs in the context of web pages visited by the user.

## Install

### Chrome:

Follow this [link](https://chromewebstore.google.com/detail/typosquatting-protection/ofhhhkhomfdapknngpeefhpipfcgmkee?hl=es) and press "INSTALL"

## Example

![Board](static/board.png)

![Settings Menu](static/settings.png)

![Example](static/example.png)

## Contributing

Contributions are welcome! 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.